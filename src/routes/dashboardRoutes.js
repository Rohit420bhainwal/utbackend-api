const router = require("express").Router();
const auth = require("../middlewares/authMiddlewares");

const { getDashboardStats } = require("../controllers/dashboardController");

router.get("/admin", auth(["admin"]), getDashboardStats);

module.exports = router;