const User = require("../models/User");
const Vendor = require("../models/Vendor");

/// ===============================
/// GET ALL USERS (ADMIN)
/// ===============================
exports.getAllUsersAdmin = async (req, res) => {
  try {
    const {
      role,
      city,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    /// 🔹 ROLE FILTER
    if (role && role !== "all") {
      filter.role = role;
    }

    /// 🔹 SEARCH (name / email)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    /// 🔹 CITY FILTER (only for vendors)
    if (city && city !== "all") {
      const vendors = await Vendor.find({ city }).select("userId");

      const userIds = vendors.map(v => v.userId);

      // If role is vendor → filter properly
      if (role === "vendor") {
        filter._id = { $in: userIds };
      } else {
        // If role is not vendor → no results for city filter
        filter._id = { $in: [] };
      }
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-password") // 🔥 IMPORTANT
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: users,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/// ===============================
/// GET PROFILE (LOGGED-IN USER)
/// ===============================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/// ===============================
/// UPDATE PROFILE
/// ===============================
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      data: user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};