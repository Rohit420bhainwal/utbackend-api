const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const otpGenerator = require("otp-generator");
const { sendOtpEmail } = require("../utils/sendEmail");


exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    /// ✅ FIX OTP (NUMERIC ONLY)
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      alphabets: false,
    });

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user;

    /// 🔥 FIX: USE findOneAndUpdate (FORCE SAVE)
    user = await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        otp,
        otpExpires: otpExpiry,
        isVerified: false, // 🔥 always reset
      },
      {
        new: true,
        upsert: true, // create if not exists
      }
    );

    console.log("✅ OTP GENERATED:", otp);
    console.log("✅ OTP SAVED IN DB:", user.otp);

    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: "OTP sent to your email",
      data: { email },
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role, phone } = req.body;

//     /// ✅ CHECK IF USER ALREADY EXISTS
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists",
//       });
//     }

//     /// 🔐 HASH PASSWORD
//     const hashedPassword = await bcrypt.hash(password, 10);

//     /// ✅ CREATE USER
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       phone,
//     });

//     /// 🎯 RETURN USER ID
//     res.json({
//       success: true,
//       message: "User registered successfully",
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         phone: user.phone,
//       },
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

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

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Entered OTP:", otp);
    console.log("Saved OTP:", user.otp);

    /// ✅ expiry safe check
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    /// ✅ SAFE comparison
    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    /// ✅ FIX TOKEN STRUCTURE
    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.json({
      success: true,
      message: "Account verified successfully",
      token,
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};