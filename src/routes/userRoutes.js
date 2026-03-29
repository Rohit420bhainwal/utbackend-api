const router = require("express").Router();
const auth = require("../middlewares/authMiddlewares");
const userCtrl = require("../controllers/userController");

// ✅ ADMIN ONLY
router.get("/admin", auth(["admin"]), userCtrl.getAllUsersAdmin);

/// GET PROFILE
router.get("/profile", auth(["admin", "vendor", "customer"]), userCtrl.getProfile);

/// UPDATE PROFILE
router.put("/profile", auth(["admin", "vendor", "customer"]), userCtrl.updateProfile);

module.exports = router;