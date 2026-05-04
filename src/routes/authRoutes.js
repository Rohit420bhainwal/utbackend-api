const router = require("express").Router();
const { register, login ,updateFcmToken,verifyOtp  } = require("../controllers/authController");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/update-fcm-token", updateFcmToken);
module.exports = router;
