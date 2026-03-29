const Provider = require("../models/Provider");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Listing = require("../models/Listing");

// ----------------------------------------
// CREATE PROVIDER PROFILE
// ----------------------------------------
exports.createProfile = async (req, res) => {
  try {
    const exists = await Provider.findOne({ userId: req.user.id });
    if (exists) {
      return res.status(400).json({ message: "Provider profile already exists" });
    }

    const provider = await Provider.create({
      userId: req.user.id,
      ...req.body
    });

    res.json({ success: true, provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// GET PROVIDER PROFILE
// ----------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id }).lean();
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not created yet" });
    }

    // Optionally include provider listings
    const listings = await Listing.find({ providerId: req.user.id, isActive: true });

    res.json({ success: true, provider, listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// UPDATE PROVIDER PROFILE
// ----------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) return res.status(404).json({ message: "Provider profile not found" });

    const allowedFields = ["companyName", "bio", "phone", "email", "avatar", "services", "experience"];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) provider[field] = req.body[field];
    });

    await provider.save();
    res.json({ success: true, provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------
// DELETE PROVIDER ACCOUNT (SOFT DELETE)
// ----------------------------------------
exports.deleteProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) return res.status(404).json({ message: "Provider profile not found" });

    provider.isDeleted = true; // soft delete
    await provider.save();

    // Optional: deactivate all listings
    await Listing.updateMany({ providerId: req.user.id }, { isActive: false });

    res.json({ success: true, message: "Provider account deleted" });
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
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide old and new password" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
