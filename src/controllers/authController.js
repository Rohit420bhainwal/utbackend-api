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

    const otp = 1234
    
    /// ✅ FIX OTP (NUMERIC ONLY)
    // upgrade the send otp and uncommnet this 
    // const otp = otpGenerator.generate(6, {
    //   upperCaseAlphabets: false,
    //   specialChars: false,
    //   alphabets: false,
    // });



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

    // upgrade the send otp and then uncomment this
    //await sendOtpEmail(email, otp);

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

exports.createVendorByAdmin = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    /// CHECK EXISTING USER
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    /// HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    /// CREATE USER WITHOUT OTP
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "vendor",
      phone,

      /// ✅ DIRECT VERIFY
      isVerified: true,

      /// OPTIONAL
      otp: null,
      otpExpires: null,
    });

    res.status(201).json({
      success: true,
      message: "Vendor user created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error("Admin vendor create error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ----------------------------------------
// FORGOT PASSWORD - SEND OTP
// ----------------------------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      role: "customer",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No customer found with this email",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP valid for 5 minutes
    const otpExpires = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // user.otp = otp;
    user.otp = 123456;
    user.otpExpires = otpExpires;

    // Reset previous verification
    user.passwordResetVerified = false;
    user.passwordResetVerifiedAt = null;

    await user.save();

    //console.log("FORGOT PASSWORD OTP:", otp);

    console.log("FORGOT PASSWORD OTP:", user.otp);

    // ----------------------------------------
    // SEND OTP EMAIL
    // ----------------------------------------
    // Put your existing email function here.
    //
    // Example:
    // await sendOtpEmail(user.email, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("Forgot password error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ----------------------------------------
// VERIFY FORGOT PASSWORD OTP
// ----------------------------------------
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      role: "customer",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check OTP
    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // OTP successfully verified
    user.passwordResetVerified = true;
    user.passwordResetVerifiedAt = new Date();

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (err) {
    console.error("Verify forgot password OTP error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ----------------------------------------
// RESET PASSWORD
// ----------------------------------------
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      role: "customer",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Make sure OTP was verified first
    if (!user.passwordResetVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    // Password reset verification valid for 10 minutes
    if (
      !user.passwordResetVerifiedAt ||
      Date.now() -
        user.passwordResetVerifiedAt.getTime() >
        10 * 60 * 1000
    ) {
      user.passwordResetVerified = false;
      user.passwordResetVerifiedAt = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "Password reset session expired. Please request a new OTP.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      newPassword,
      salt
    );

    // Clear reset verification
    user.passwordResetVerified = false;
    user.passwordResetVerifiedAt = null;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (err) {
    console.error("Reset password error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};