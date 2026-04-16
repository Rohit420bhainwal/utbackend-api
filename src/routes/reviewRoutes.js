const express = require("express");
const router = express.Router();

const {
  addReview,
  getReviewByLead,
  getReviewsByService,
} = require("../controllers/reviewController");

const authMiddleware = require("../middlewares/authMiddlewares");

/// ✅ ADD REVIEW
router.post(
  "/",
  authMiddleware(["customer"], "customer"),
  addReview
);

/// ✅ GET REVIEW FOR A LEAD (for UI)
router.get(
  "/lead/:leadId",
  authMiddleware(["customer", "admin"], null),
  getReviewByLead
);

/// ✅ GET ALL REVIEWS OF A SERVICE
router.get(
  "/service/:serviceId",
  getReviewsByService
);

module.exports = router;