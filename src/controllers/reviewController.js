
const Lead = require("../models/Lead");
const Service = require("../models/Service");
const Review = require("../models/Review");

/// ✅ ADD REVIEW
exports.addReview = async (req, res) => {
  try {
    const { leadId, rating, review } = req.body;
    const customerId = req.user.id;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    /// 🔥 ONLY CLOSED
    if (lead.status !== "closed") {
      return res.status(400).json({
        message: "You can review only after lead is closed",
      });
    }

    /// 🔥 ONE REVIEW PER LEAD
    const existing = await Review.findOne({ leadId });
    if (existing) {
      return res.status(400).json({
        message: "Review already submitted",
      });
    }

    const newReview = await Review.create({
      leadId,
      serviceId: lead.service.serviceId,
      customerId,
      vendorId: lead.vendorId,
      rating,
      review,
    });

    /// 🔥 UPDATE AVG RATING
    const stats = await Review.aggregate([
      { $match: { serviceId: lead.service.serviceId } },
      {
        $group: {
          _id: "$serviceId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    await Service.findByIdAndUpdate(lead.service.serviceId, {
      avgRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
    });

    res.json({
      success: true,
      data: newReview,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/// ✅ GET REVIEW BY LEAD
exports.getReviewByLead = async (req, res) => {
    try {
      const review = await Review.findOne({
        leadId: req.params.leadId,
      });
  
      /// 🔥 NO REVIEW FOUND
      if (!review) {
        return res.json({
          success: true,
          hasReview: false, // ✅ IMPORTANT FLAG
          message: "No review found for this lead",
          data: null,
        });
      }
  
      /// ✅ REVIEW EXISTS
      res.json({
        success: true,
        hasReview: true, // ✅ IMPORTANT FLAG
        message: "Review fetched successfully",
        data: review,
      });
  
    } catch (e) {
      res.status(500).json({
        success: false,
        message: e.message,
      });
    }
  };

/// ✅ GET SERVICE REVIEWS
exports.getReviewsByService = async (req, res) => {
  try {
    const reviews = await Review.find({
      serviceId: req.params.serviceId,
    })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};