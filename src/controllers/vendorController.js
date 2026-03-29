const Vendor = require("../models/Vendor");

exports.createVendor = async (req, res) => {
  try {
    const { userId } = req.body;

    /// 🔥 CHECK IF VENDOR ALREADY EXISTS
    const existingVendor = await Vendor.findOne({ userId });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: "Vendor already exists for this user",
      });
    }

    /// ✅ CREATE NEW VENDOR
    const vendor = await Vendor.create({
      ...req.body,
    });

    res.json({
      success: true,
      data: vendor,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getVendors = async (req, res) => {
  const vendors = await Vendor.find().populate("userId");
  res.json({
    success: true, data: vendors  });
};

exports.getVendorById = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id)
    .populate("userId");
  res.json(vendor);
};

exports.updateVendor = async (req, res) => {
  const vendor = await Vendor.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(vendor);
};

exports.deleteVendor = async (req, res) => {
  await Vendor.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};