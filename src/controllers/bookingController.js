const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Provider = require("../models/Provider");

// ----------------------------------------------------
// CREATE BOOKING (CREATE ORDER ONLY)
// ----------------------------------------------------
exports.createBooking = async (req, res) => {
  try {
    const {
      listingId,
      eventDate,
      startTime,
      endTime,
      payPercentage
    } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing)
      return res.status(404).json({ message: "Listing not found" });

    // 🔒 Availability check
    const conflict = await Booking.findOne({
      listingId,
      eventDate: new Date(eventDate),
      status: { $in: ["CREATED", "AWAITING_PAYMENT", "ACCEPTED"] },
      $expr: {
        $and: [
          { $lt: ["$timeSlot.startTime", endTime] },
          { $gt: ["$timeSlot.endTime", startTime] }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({
        message: "Selected date & time slot is already booked"
      });
    }

    const totalAmount = listing.price;
    const payNowAmount = Math.floor((totalAmount * payPercentage) / 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: payNowAmount * 100,
      currency: "INR",
      receipt: `booking_${Date.now()}`
    });

    const booking = await Booking.create({
      customerId: req.user.id,
      providerId: listing.providerId,
      listingId,

      eventDate,
      timeSlot: { startTime, endTime },

      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,

      payments: [
        {
          orderId: razorpayOrder.id,
          amount: payNowAmount,
          status: "CREATED"
        }
      ],

      paymentStatus: "PENDING",
      paymentDueDate:
        payPercentage < 100
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : null,

      status: "AWAITING_PAYMENT"
    });

    res.json({
      success: true,
      bookingId: booking._id,
      razorpayOrder
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};


// ----------------------------------------------------
// VERIFY PAYMENT (SIGNATURE + DUPLICATE PROTECTION)
// ----------------------------------------------------
exports.verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 🔒 Ownership validation
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🔁 Duplicate payment protection
    const alreadyPaid = booking.payments.some(
      p => p.paymentId === razorpay_payment_id
    );
    if (alreadyPaid) {
      return res.status(400).json({ message: "Payment already processed" });
    }

    // 🔐 Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // ✅ Save payment
    booking.payments.push({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount,
      status: "SUCCESS"
    });

    booking.paidAmount += amount;
    booking.remainingAmount = booking.totalAmount - booking.paidAmount;

    if (booking.remainingAmount <= 0) {
      booking.remainingAmount = 0;
      booking.paymentStatus = "PAID";
      booking.status = "ACCEPTED";
    } else {
      booking.paymentStatus = "PARTIALLY_PAID";
      booking.status = "AWAITING_PAYMENT";
    }

    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// ----------------------------------------------------
// PAY REMAINING AMOUNT (CREATE NEW ORDER)
// ----------------------------------------------------
exports.payRemainingAmount = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.remainingAmount <= 0) {
      return res.status(400).json({ message: "No pending amount" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `booking_remaining_${Date.now()}`
    });

    booking.payments.push({
      orderId: razorpayOrder.id,
      amount,
      status: "CREATED"
    });

    await booking.save();

    res.json({ success: true, razorpayOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------------------------------------------------
// CUSTOMER CANCEL BOOKING
// ----------------------------------------------------
exports.customerCancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "CANCELLED";

    for (const payment of booking.payments) {
      if (payment.status === "SUCCESS") {
        await razorpay.payments.refund(payment.paymentId, {
          amount: payment.amount * 100
        });
        payment.status = "REFUNDED";
      }
    }

    booking.paymentStatus = "REFUNDED";
    booking.paidAmount = 0;

    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------------------------------------------------
// PROVIDER CANCEL BOOKING
// ----------------------------------------------------
exports.providerCancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "CANCELLED";

    for (const payment of booking.payments) {
      if (payment.status === "SUCCESS") {
        await razorpay.payments.refund(payment.paymentId, {
          amount: payment.amount * 100
        });
        payment.status = "REFUNDED";
      }
    }

    booking.paymentStatus = "REFUNDED";
    booking.paidAmount = 0;

    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ----------------------------------------------------
// GET BOOKINGS
// ----------------------------------------------------
exports.getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ customerId: req.user.id })
    .populate("listingId");
  res.json(bookings);
};



exports.getProviderBookings = async (req, res) => {
  try {
    console.log("PROVIDER USER 👉", req.user);

    // 1️⃣ Find provider profile linked to this user
    const provider = await Provider.findOne({
      userId: req.user.id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    // 2️⃣ Fetch bookings using PROVIDER ID
    const bookings = await Booking.find({
      providerId: provider._id,
    })
      .populate("listingId")
      .populate("customerId");

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};


// ----------------------------------------------------
// PROVIDER ACCEPT / REJECT
// ----------------------------------------------------
exports.acceptBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.providerId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  booking.status = "ACCEPTED";
  await booking.save();
  res.json({ success: true, booking });
};

exports.rejectBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.providerId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  booking.status = "REJECTED";
  await booking.save();
  res.json({ success: true, booking });
};


exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    const receivedSignature = req.headers["x-razorpay-signature"];

    if (expectedSignature !== receivedSignature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      const booking = await Booking.findOne({
        "payments.orderId": orderId
      });

      if (!booking) return res.json({ status: "ignored" });

      // 🔁 Prevent duplicate processing
      const alreadyProcessed = booking.payments.some(
        p => p.paymentId === payment.id
      );
      if (alreadyProcessed) return res.json({ status: "duplicate" });

      booking.payments.push({
        orderId,
        paymentId: payment.id,
        amount: payment.amount / 100,
        status: "SUCCESS"
      });

      booking.paidAmount += payment.amount / 100;
      booking.remainingAmount =
        booking.totalAmount - booking.paidAmount;

      if (booking.remainingAmount <= 0) {
        booking.remainingAmount = 0;
        booking.paymentStatus = "PAID";
        booking.status = "ACCEPTED";
      } else {
        booking.paymentStatus = "PARTIALLY_PAID";
        booking.status = "AWAITING_PAYMENT";
      }

      await booking.save();
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ message: "Webhook failed" });
  }
};


exports.completeBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.providerId.toString() !== req.user.id)
    return res.status(403).json({ message: "Not authorized" });

  booking.status = "COMPLETED";
  await booking.save();

  res.json({ success: true, message: "Booking marked as completed", booking });
};

exports.addReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // 1️⃣ Get the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 2️⃣ Ensure the customer owns this booking
    if (booking.customerId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    // 3️⃣ Ensure the service is completed
    if (booking.status !== "COMPLETED")
      return res.status(400).json({ message: "Cannot review before service completion" });

    // 4️⃣ Add review in booking
    booking.review = { rating, comment, createdAt: new Date() };
    await booking.save();

    // 5️⃣ Update Listing averageRating and reviewCount
    const allBookings = await Booking.find({
      listingId: booking.listingId,
      "review.rating": { $exists: true } // only consider bookings with reviews
    });

    const avgRating =
      allBookings.reduce((acc, b) => acc + b.review.rating, 0) / allBookings.length;

    await Listing.findByIdAndUpdate(booking.listingId, {
      averageRating: avgRating,
      reviewCount: allBookings.length
    });

    res.json({ success: true, message: "Review added successfully", review: booking.review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
