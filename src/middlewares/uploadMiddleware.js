const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 🔥 DYNAMIC STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    let folder = "uploads/others"; // default

    // ✅ Decide folder based on route
    if (req.baseUrl.includes("services")) {
      folder = "uploads/services";
    } else if (req.baseUrl.includes("customer")) {
      folder = "uploads/profile";
    }

    // ✅ CREATE FOLDER IF NOT EXISTS
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// ✅ FILE FILTER
const fileFilter = (req, file, cb) => {
  console.log("MIME:", file.mimetype);

  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;