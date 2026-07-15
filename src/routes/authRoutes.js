const router = require("express").Router();
const { register, login ,updateFcmToken,verifyOtp,createVendorByAdmin  } = require("../controllers/authController");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/update-fcm-token", updateFcmToken);
router.post("/admin-create-vendor", createVendorByAdmin);
module.exports = router;
