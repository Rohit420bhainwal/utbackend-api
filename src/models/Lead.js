const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    /// 🔹 CUSTOMER SNAPSHOT
    customer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String,
      email: String,
      phone: String,
    },

    /// 🔹 VENDOR REFERENCE
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    /// 🔹 SERVICE SNAPSHOT
    service: {
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
      title: String,
      categoryName: String,
      city: String,
    },

    /// 🔹 EVENT DETAILS
    eventDetails: {
      eventType: {
        type: String,
        enum: ["wedding", "birthday", "corporate", "engagement", "other"],
      },
      eventDate: Date,
      guestCount: Number,
      budget: String,
      city: String,
    },

    /// 🔥 CHAT SYSTEM (UPDATED FOR ADMIN SUPPORT)
    messages: [
      {
        sender: {
          type: String,
          enum: ["customer", "vendor", "admin"], // ✅ NOW SUPPORTS ADMIN
          required: true,
        },

        text: {
          type: String,
          required: true,
        },

        /// 🔥 WHO ACTUALLY SENT (USER ID)
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        /// 🔥 OPTIONAL: SHOW ADMIN BADGE IN UI
        isAdmin: {
          type: Boolean,
          default: false,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /// 🔹 STATUS
    status: {
      type: String,
      enum: ["new", "viewed", "contacted", "converted", "closed"],
      default: "new",
    },

    /// 🔹 SOURCE
    source: {
      type: String,
      default: "app",
    },
  },
  { timestamps: true }
);

/// 🔥 INDEXES
leadSchema.index({ vendorId: 1, createdAt: -1 });
leadSchema.index({ "customer.userId": 1 });

module.exports = mongoose.model("Lead", leadSchema);