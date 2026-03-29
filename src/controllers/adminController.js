const User = require("../models/User");
const Provider = require("../models/Provider");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");

// ----------------------------------------
// GET ALL USERS (Customers + Providers)
// ----------------------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer", isDeleted: { $ne: true } }).select("-password");
    const providers = await User.find({ role: "provider", isDeleted: { $ne: true } }).select("-password");

    res.json({ success: true, customers, providers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// GET ALL PROVIDER PROFILES
// ----------------------------------------
exports.getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ isDeleted: { $ne: true } });
    res.json({ success: true, providers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// GET ALL LISTINGS
// ----------------------------------------
exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find().populate("providerId", "userId");
    res.json({ success: true, listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// DELETE / DEACTIVATE LISTING (Soft Delete)
// ----------------------------------------
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    listing.isActive = false; // soft delete
    await listing.save();

    res.json({ success: true, message: "Listing deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// GET ALL BOOKINGS
// ----------------------------------------
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId", "name email")
      .populate("providerId", "userId")
      .populate("listingId", "title price");

    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// DELETE / CANCEL BOOKING (Optional)
// ----------------------------------------
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "CANCELLED";
    booking.paymentStatus = "REFUNDED";

    // Optional: refund successful payments
    for (const payment of booking.payments) {
      if (payment.status === "SUCCESS") {
        // await razorpay.payments.refund(payment.paymentId, { amount: payment.amount * 100 });
        payment.status = "REFUNDED";
      }
    }

    await booking.save();
    res.json({ success: true, message: "Booking cancelled by admin", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
