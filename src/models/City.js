// models/City.js
const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  state: String,

  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("City", citySchema);