const Lead = require("../models/Lead");
const Service = require("../models/Service");
const Vendor = require("../models/Vendor");
const admin = require("../config/firebase"); // 🔥 ADD THIS
const User = require("../models/User");


exports.createLead = async (req, res) => {
  try {
    const {
      serviceId,
      eventType,
      eventDate,
      guestCount,
      budget,
      city,
      message,
    } = req.body;

    // 🔹 Get service
    const service = await Service.findById(serviceId)
      .populate("vendorId")
      .populate("categoryId");

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const user = await User.findById(req.user.id);
    // 🔹 Create lead
    const lead = await Lead.create({
      customer: {
        userId: user._id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
      },

      vendorId: service.vendorId._id,

      service: {
        serviceId: service._id,
        title: service.title,
        categoryName: service.categoryId?.name,
        city: service.vendorId?.city,
      },

      eventDetails: {
        eventType,
        eventDate,
        guestCount,
        budget,
        city,
      },

      message,
    });

    // ===============================
    // 🔥 SEND NOTIFICATION TO ADMINS
    // ===============================

    try {
      const admins = await User.find({
        role: "admin",
        fcmToken: { $ne: null },
      });

      const tokens = admins.map((a) => a.fcmToken);

      if (tokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: "New Lead 🚀",
            body: `${user?.name || "Customer"} created a new inquiry`,
          },
          data: {
            type: "NEW_LEAD",
            leadId: lead._id.toString(),
          },
        });

        console.log("✅ Notification sent to admins");
      } else {
        console.log("⚠️ No admin tokens found");
      }
    } catch (notifyError) {
      console.error("❌ Notification error:", notifyError);
    }

    // 🔹 Response
    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: lead,
    });

  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.getMyLeads = async (req, res) => {
  try {
    const leads = await Lead.find({
      "customer.userId": req.user.id,
    })
      .populate("customer.userId", "name email phone") // 🔥 ADD THIS
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// exports.getMyLeads = async (req, res) => {
//   try {
//     const leads = await Lead.find({
//       "customer.userId": req.user.id,   // since your JWT has id
//     }).sort({ createdAt: -1 });

//     res.json({
//       success: true, data: leads});
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.getVendorLeads = async (req, res) => {
  try {
    console.log("REQ USER:", req.user); // 🔥 debug

    const vendor = await Vendor.findOne({ userId: req.user.id });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const leads = await Lead.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Vendor Leads Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllLeadsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("vendorId", "businessName city")
      .populate("customer.userId", "name email phone");

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: leads,
    });
  } catch (error) {
    console.error("Admin fetch leads error:", error);
    res.status(500).json({ message: error.message });
  }
};



  // exports.getAllLeadsAdminn = async (req, res) => {
  //   try {
  //     const { page = 1, limit = 10, status } = req.query;
  
  //     const query = {};
  
  //     // Optional status filter
  //     if (status) {
  //       query.status = status;
  //     }
  
  //     const leads = await Lead.find(query)
  //       .sort({ createdAt: -1 })
  //       .skip((page - 1) * limit)
  //       .limit(parseInt(limit))
  //       .populate("vendorId", "businessName city")
  //       .populate("customer.userId", "name email phone");
  
  //     const total = await Lead.countDocuments(query);
  
  //     res.json({
  //       success: true,
  //       total,
  //       page: Number(page),
  //       totalPages: Math.ceil(total / limit),
  //       data: leads,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // };

  exports.getLeadDetailsAdmin = async (req, res) => {
    try {
      const { id } = req.params;
  
      const lead = await Lead.findById(id)
        .populate("vendorId", "businessName city")
        .populate("customer.userId", "name email phone");
  
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
  
      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  exports.updateLeadStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      const allowedStatus = ["new", "contacted", "converted", "closed"];
  
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }
  
      const lead = await Lead.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      )
        .populate("vendorId", "businessName city")
        .populate("customer.userId", "name email phone fcmToken");
  
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
  
      // ===============================
      // 🔥 SEND DATA-ONLY NOTIFICATION
      // ===============================
      try {
        const customer = lead.customer?.userId;
  
        console.log(`🔔 FCM Token: ${customer?.fcmToken || "EMPTY"}`);
  
        if (customer?.fcmToken) {
          let statusMessage = "";
  
          switch (status) {
            case "new":
              statusMessage =
                "Thanks for reaching out to Utsav! Our team is reviewing your requirement.";
              break;
  
            case "contacted":
              statusMessage =
                "Team Utsav has contacted you to understand your requirements better.";
              break;
  
            case "converted":
              statusMessage =
                "We’ve found a perfect vendor match for your event! Our team will assist you further.";
              break;
  
            case "closed":
              statusMessage =
                "This request has been closed. You can always create a new request anytime.";
              break;
  
            default:
              statusMessage = "Your request status has been updated.";
          }
  
          await admin.messaging().send({
            token: customer.fcmToken,
  
            // ✅ DATA ONLY (NO notification block)
            data: {
              title: "Inquiry Update 🔔",
              body: `Hi ${customer.name}, ${statusMessage}`,
              type: "LEAD_STATUS_UPDATE",
              leadId: lead._id.toString(),
              status: status,
            },
  
            android: {
              priority: "high",
            },
          });
  
          console.log("✅ Data notification sent to customer");
        } else {
          console.log("⚠️ Customer FCM token not found");
        }
      } catch (notifyError) {
        console.error("❌ Notification error:", notifyError);
      }
  
      res.json({
        success: true,
        message: "Lead status updated",
        data: lead,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  // exports.updateLeadStatus = async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const { status } = req.body;
  
  //     const allowedStatus = ["new", "contacted", "converted", "closed"];
  
  //     if (!allowedStatus.includes(status)) {
  //       return res.status(400).json({
  //         message: "Invalid status",
  //       });
  //     }
  
  //     const lead = await Lead.findByIdAndUpdate(
  //       id,
  //       { status },
  //       { new: true }
  //     )
  //       .populate("vendorId", "businessName city")
  //       .populate("customer.userId", "name email phone");
  
  //     if (!lead) {
  //       return res.status(404).json({ message: "Lead not found" });
  //     }
  
  //     res.json({
  //       success: true,
  //       message: "Lead status updated",
  //       data: lead,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // };

  exports.addNote = async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
  
      const lead = await Lead.findByIdAndUpdate(
        id,
        { $push: { notes: note } },
        { new: true }
      );
  
      res.json({
        success: true,
        message: "Note added",
        data: lead,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.getMyLeadDetails = async (req, res) => {
    try {
      const { id } = req.params;
  
      const lead = await Lead.findOne({
        _id: id,
        "customer.userId": req.user.id, // 🔒 security check
      })
        .populate("vendorId", "businessName city phone")
        .populate("service.serviceId");
  
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }
  
      res.json({
        success: true,
        data: lead,
      });
  
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

  exports.sendMessage = async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
  
      if (!text) {
        return res.status(400).json({ message: "Message is required" });
      }
  
      const lead = await Lead.findById(id);
  
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
  
      let sender = "customer";
      let isAdmin = false;
  
      /// 🔥 ROLE HANDLING
      if (req.user.role === "vendor") {
        sender = "vendor";
      } else if (req.user.role === "admin") {
        sender = "vendor"; // 👈 act as vendor
        isAdmin = true;    // 👈 mark internally
      }
  
      lead.messages.push({
        sender,
        text,
        isAdmin, // 👈 track admin involvement
        createdAt: new Date(),
      });
  
      await lead.save();
  
      res.json({
        success: true,
        message: "Message sent",
        data: lead,
      });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };