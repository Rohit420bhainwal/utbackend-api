const router = require("express").Router();
const auth = require("../middlewares/authMiddlewares");
const providerCtrl = require("../controllers/providerController");

// 🔐 Lock entire router to PROVIDER + PROVIDER APP
router.use(auth(["provider"], "provider"));

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "Provider API OK" });
});

// Provider Profile
router.get("/profile", providerCtrl.getProfile);
router.post("/profile", providerCtrl.createProfile);
router.put("/profile", providerCtrl.updateProfile);
router.delete("/profile", providerCtrl.deleteProfile);
router.put("/change-password", providerCtrl.changePassword);

module.exports = router;
