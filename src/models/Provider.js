const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  businessName: String,
  categories: [String],
  location: String,
  documents: [String],
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Provider", providerSchema);
