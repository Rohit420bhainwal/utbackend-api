const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");


exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    /// ✅ CHECK IF USER ALREADY EXISTS
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    /// 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    /// ✅ CREATE USER
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    /// 🎯 RETURN USER ID
    res.json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, appType } = req.body;

    if (!appType) {
      return res.status(400).json({
        success: false,
        message: "App type is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 🔐 Role vs App validation
    if (user.role !== appType) {
      return res.status(403).json({
        success: false,
        message: `You are not allowed to login into ${appType} app`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      appType
    });

    const sanitizedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone:user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: sanitizedUser,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.updateFcmToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    await User.findByIdAndUpdate(userId, {
      fcmToken,
    });

    res.json({ success: true, message: "Token updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};