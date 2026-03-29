const router = require("express").Router();
const auth = require("../middlewares/authMiddlewares");
const adminCtrl = require("../controllers/adminController");

// 🔐 Only admin role + admin app
router.use(auth(["admin"], "admin"));

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "Admin API OK" });
});

// Users
router.get("/users", adminCtrl.getAllUsers);
router.get("/providers", adminCtrl.getAllProviders);

// Listings
router.get("/listings", adminCtrl.getAllListings);
router.delete("/listings/:id", adminCtrl.deleteListing);

// Bookings
router.get("/bookings", adminCtrl.getAllBookings);
router.delete("/bookings/:id", adminCtrl.cancelBooking);

module.exports = router;
