// src/utils/bookingScheduler.js
const Booking = require("../models/Booking");

const checkPartialPayments = async () => {
  try {
    const now = new Date();

    const bookings = await Booking.find({
      paymentStatus: { $in: ["PENDING", "PARTIALLY_PAID"] },
      paymentDueDate: { $lte: now },
      status: { $in: ["CREATED", "AWAITING_PAYMENT"] }
    });

    for (const booking of bookings) {
      booking.status = "CANCELLED";
      booking.paymentStatus = "PARTIALLY_PAID"; // token amount kept
      // remainingAmount stays as-is (important for audit)

      await booking.save();

      console.log(
        `⏱ Booking ${booking._id} auto-cancelled due to unpaid balance`
      );

      // TODO: notify customer + provider
    }
  } catch (err) {
    console.error("Booking scheduler error:", err);
  }
};

module.exports = { checkPartialPayments };
