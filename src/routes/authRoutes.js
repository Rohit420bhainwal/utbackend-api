const router = require("express").Router();
const { register, login ,updateFcmToken,verifyOtp,createVendorByAdmin,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
  } = require("../controllers/authController");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/update-fcm-token", updateFcmToken);
router.post("/admin-create-vendor", createVendorByAdmin);


router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
