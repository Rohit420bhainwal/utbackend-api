// routes/cityRoutes.js
const express = require("express");
const router = express.Router();

const cityCtrl = require("../controllers/cityController");
const auth = require("../middlewares/authMiddlewares");

// 🔐 Only ADMIN can manage cities
router.post("/", auth(["admin"], "admin"), cityCtrl.addCity);
router.put("/:id", auth(["admin"], "admin"), cityCtrl.updateCity);
router.delete("/:id", auth(["admin"], "admin"), cityCtrl.deleteCity);

// 🌍 PUBLIC (customer app)
router.get("/", cityCtrl.getCities);

module.exports = router;