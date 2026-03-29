// controllers/cityController.js
const City = require("../models/City");


// ================= ADD CITY =================
exports.addCity = async (req, res) => {
  try {
    const { name, state } = req.body;

    const city = await City.create({ name, state });

    res.json({
      success: true,
      message: "City added",
      city,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// ================= GET ALL CITIES =================
exports.getCities = async (req, res) => {
  try {
    const cities = await City.find({ isActive: true }).sort({ name: 1 });

    res.json({
      success: true,
      data: cities,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= UPDATE CITY =================
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      city,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= DELETE CITY =================
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    await City.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "City deleted",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};