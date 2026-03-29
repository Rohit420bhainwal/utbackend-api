const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ----------------------------------------
// GET CUSTOMER PROFILE
// ----------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const customer = await User.findById(req.user.id).select("-password");
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    console.log("customer: "+customer);
    res.json({ success: true, customer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// UPDATE CUSTOMER PROFILE
// ----------------------------------------

const fs = require("fs");
const path = require("path");

// ----------------------------------------
// UPDATE CUSTOMER PROFILE WITH IMAGE
// ----------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // ✅ Update fields
    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;

    // ✅ HANDLE IMAGE UPLOAD
    if (req.file) {
      // 🔥 DELETE OLD IMAGE (if exists)
      if (customer.avatar) {
        const oldPath = path.join(__dirname, "..", "..", customer.avatar);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // ✅ SAVE NEW IMAGE
      customer.avatar = req.file.path;
    }

    await customer.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      customer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, email, phone, avatar } = req.body;

//     const customer = await User.findById(req.user.id);
//     if (!customer) return res.status(404).json({ message: "Customer not found" });

//     if (name) customer.name = name;
//     if (email) customer.email = email;
//     if (phone) customer.phone = phone;
//     if (avatar) customer.avatar = avatar;

//     await customer.save();

//     res.json({ success: true, customer });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// ----------------------------------------
// DELETE CUSTOMER ACCOUNT (SOFT DELETE)
// ----------------------------------------
exports.deleteProfile = async (req, res) => {
  try {
    const customer = await User.findById(req.user.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.isDeleted = true; // soft delete flag
    await customer.save();

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// CHANGE PASSWORD
// ----------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Please provide old and new password" });

    const customer = await User.findById(req.user.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(newPassword, salt);

    await customer.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
