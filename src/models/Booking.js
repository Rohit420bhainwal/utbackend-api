// src/models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },

  // 📅 Actual service date
  eventDate: { type: Date, required: true },

  // ⏰ Time slot
  timeSlot: {
    startTime: { type: String, required: true }, // "16:30"
    endTime: { type: String, required: true }    // "22:30"
  },

  totalAmount: { type: Number, required: true },

  payments: [
    {
      orderId: String,
      paymentId: String,
      amount: Number,
      status: {
        type: String,
        enum: ["CREATED", "SUCCESS", "REFUNDED"],
        default: "CREATED"
      }
    }
  ],

  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },

  paymentStatus: {
    type: String,
    enum: ["PENDING", "PARTIALLY_PAID", "PAID", "REFUNDED"],
    default: "PENDING"
  },

  paymentDueDate: Date,

  status: {
    type: String,
    enum: [
      "CREATED",
      "AWAITING_PAYMENT",
      "ACCEPTED",
      "REJECTED",
      "CANCELLED",
      "COMPLETED"
    ],
    default: "CREATED"
  },

  // ⭐ Rating & Review (per booking)
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: "" },
    createdAt: { type: Date }
  }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
