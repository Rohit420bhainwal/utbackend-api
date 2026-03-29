const express = require("express");
const router = express.Router();
const controller = require("../controllers/categoryController");
const auth = require("../middlewares/authMiddlewares");

// ✅ use auth like your other routes
router.post("/", auth(["admin"], "admin"), controller.createCategory);
router.get("/", controller.getCategories);
router.put("/:id", auth(["admin"], "admin"), controller.updateCategory);
router.delete("/:id", auth(["admin"], "admin"), controller.deleteCategory);

module.exports = router;