const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    businessName: String,
    description: String,
    logo: String,
    coverImages: [String],
    address: String,
    city: String,
    state: String,
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);