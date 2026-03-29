const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddlewares");
const customerCtrl = require("../controllers/customerController");
const upload = require("../middlewares/uploadMiddleware");

// 🔐 Lock entire router to CUSTOMER + CUSTOMER APP
router.use(auth(["customer"], "customer"));

router.get("/profile", customerCtrl.getProfile);

// 🔥 MULTIPART PUT (image upload)
router.put(
    "/profile",
    upload.single("avatar"), // 👈 must match frontend key
    customerCtrl.updateProfile
  );

//router.put("/profile", customerCtrl.updateProfile);
router.delete("/profile", customerCtrl.deleteProfile);
router.put("/change-password", customerCtrl.changePassword);

module.exports = router;
