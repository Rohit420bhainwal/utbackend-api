const express = require("express");

const router = express.Router();

const upload = require("../middlewares/uploadMiddleware");

const {
  testUpload,
} = require("../controllers/testController");

router.post(
  "/upload",
  upload.single("image"),
  testUpload
);

module.exports = router;