const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Service = require("../models/Service");
const Lead = require("../models/Lead");

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalAdmin,
      totalVendors,
      totalServices,
      totalLeads,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }), // ✅ ONLY CUSTOMERS
      User.countDocuments({ role: "admin" }),
      Vendor.countDocuments(),
      Service.countDocuments(),
      Lead.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,   // ✅ renamed
        totalAdmin,
        totalVendors,
        totalServices,
        totalLeads,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};