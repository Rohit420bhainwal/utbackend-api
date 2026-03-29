const express = require("express");
const router = express.Router();
const controller = require("../controllers/vendorController");
const auth = require("../middlewares/authMiddlewares");

// Create vendor (admin or provider)
router.post("/", auth(["admin", "vendor"]), controller.createVendor);


router.get("/", controller.getVendors);
router.get("/:id", controller.getVendorById);

// Update vendor
router.put("/:id", auth(["admin", "vendor"]), controller.updateVendor);

// Delete vendor
router.delete("/:id", auth(["admin"]), controller.deleteVendor);

module.exports = router;