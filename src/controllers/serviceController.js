const Service = require("../models/Service");

/*
// ===============================
// CREATE SERVICE
// ===============================
exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};*/

exports.createService = async (req, res) => {
  try {
    let imagePaths = [];

    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map((file) =>
        file.path.replace(/\\/g, "/") // 🔥 convert \ to /
      );
    }

    const serviceData = {
      ...req.body,
      images: imagePaths, // save images array
    };

    const service = await Service.create(serviceData);

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// GET SERVICES (WITH FILTERS)
// ===============================
const Category = require("../models/Category");

exports.getServices = async (req, res) => {
  try {
    const {
      category,
      featured,
      city,
      minPrice,
      maxPrice,
      vendorId,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = { isActive: true };

    // ================= VENDOR FILTER =================
    if (vendorId) {
      filter.vendorId = vendorId;
    }

    // ================= CATEGORY FILTER (FIXED 🔥) =================
    if (category && category !== "all") {
      let categoryId = category;

      // 👉 If it's NOT ObjectId → treat as NAME
      if (!category.match(/^[0-9a-fA-F]{24}$/)) {
        const categoryDoc = await Category.findOne({
          name: { $regex: new RegExp(`^${category}$`, "i") }, // case-insensitive
        });

        if (!categoryDoc) {
          return res.json({
            success: true,
            total: 0,
            data: [],
            message: "No category found",
          });
        }

        categoryId = categoryDoc._id;
      }

      filter.categoryId = categoryId;
    }

    // ================= FEATURED =================
    if (featured === "true") {
      filter.isFeatured = true;
    }

    // ================= PRICE =================
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;

    // ================= MAIN QUERY =================
    const services = await Service.find(filter)
      .populate({
        path: "vendorId",
        select: "businessName city",
        match: city ? { city: city } : {}, // ✅ CITY FILTER
      })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // ================= REMOVE NULL VENDORS =================
    const filteredServices = services.filter(
      (s) => s.vendorId !== null
    );

    const total = filteredServices.length;

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: filteredServices,
    });

  } catch (error) {
    console.error("GET SERVICES ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// GET SINGLE SERVICE
// ===============================
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("vendorId")
      .populate("categoryId");

    if (!service) {
      console.log(service);
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ===============================
// UPDATE SERVICE
// ===============================

exports.updateService = async (req, res) => {
  try {
    let imagePaths = [];

    /// 🔥 existing images from frontend
    if (req.body.existingImages) {
      imagePaths = req.body.existingImages.split(",");
    }

    /// 🔥 new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      imagePaths = [...imagePaths, ...newImages];
    }

    const updatedData = {
      ...req.body,
      images: imagePaths,
    };

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.json({
      success: true,
      data: service,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// exports.updateService = async (req, res) => {
//   try {
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );

//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: "Service not found",
//       });
//     }

//     res.json({
//       success: true,
//       data: service,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


// ===============================
// DELETE SERVICE
// ===============================
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};