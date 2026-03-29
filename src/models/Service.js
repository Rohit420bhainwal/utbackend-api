const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    title: String,
    description: String,
    serviceType: {
      type: String,
      enum: ["venue", "individual"],
    },
    capacity: {
      min: Number,
      max: Number,
    },
    pricingModel: {
      type: String,
      enum: ["per_plate", "per_day", "per_hour", "package"],
    },
    price: Number,
    amenities: [String],
    customFields: mongoose.Schema.Types.Mixed,
    images: [
      {
        type: String, // stores file path or URL
      },
    ],

    thumbnail: {
      type: String,
    },
    
   // images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);