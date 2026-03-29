const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  avatar: {
    type: String, // will store file path like: uploads/users/xxx.jpg
    default: "",
  },
  role: {
    type: String,
    enum: ["customer", "vendor", "admin"],
    default: "customer"
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
