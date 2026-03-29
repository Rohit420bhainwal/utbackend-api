const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddlewares");
const bookingCtrl = require("../controllers/bookingController");

// Customer
router.post("/", auth(["customer"]), bookingCtrl.createBooking);
router.post("/verify-payment", auth(["customer"]), bookingCtrl.verifyPayment);
router.post("/pay-remaining", auth(["customer"]), bookingCtrl.payRemainingAmount);
router.post("/cancel", auth(["customer"]), bookingCtrl.customerCancelBooking);
router.get("/my", auth(["customer"]), bookingCtrl.getMyBookings);

// Provider
router.get("/provider", auth(["provider"]), bookingCtrl.getProviderBookings);
router.post("/provider/cancel", auth(["provider"]), bookingCtrl.providerCancelBooking);
router.post("/provider/:id/accept", auth(["provider"]), bookingCtrl.acceptBooking);
router.post("/provider/:id/reject", auth(["provider"]), bookingCtrl.rejectBooking);

router.post("/review", auth(["customer"]), bookingCtrl.addReview);

router.post(
    "/webhook/razorpay",
    express.raw({ type: "application/json" }),
    bookingCtrl.razorpayWebhook
  );

module.exports = router;
