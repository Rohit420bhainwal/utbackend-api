const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviceController");
const auth = require("../middlewares/authMiddlewares");

const upload = require("../middlewares/uploadMiddleware");
// Create service (admin or vendor)
//router.post("/", auth(["admin", "vendor"]), controller.createService);


//router.post("/", auth(["admin"]), controller.createService);

router.post("/", auth(["admin"]),upload.array("images", 5), controller.createService);

// Get services with filters
router.get("/", controller.getServices);

// Get single service
router.get("/:id", controller.getServiceById);

// Update service
//router.put("/:id", auth(["admin", "vendor"]), controller.updateService);

router.put(
    "/:id",
    auth(["admin", "vendor"]),
    upload.array("images", 5), // 👈 ADD THIS
    controller.updateService
  );

// Delete service
router.delete("/:id", auth(["admin"]), controller.deleteService);

module.exports = router;