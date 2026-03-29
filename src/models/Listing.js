const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String }, // e.g., wedding, party, catering
  images: { type: [String], default: [] }, // URLs or file paths
  isActive: { type: Boolean, default: true },
  reviews: [
    {
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, required: true },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
  
  
}, { timestamps: true });

module.exports = mongoose.model("Listing", listingSchema);
