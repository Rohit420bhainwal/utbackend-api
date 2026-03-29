const Listing = require("../models/Listing");
const Booking = require("../models/Booking");

// ------------------ Create Listing (Provider) ------------------
exports.createListing = async (req, res) => {
  try {
    const providerId = req.user.id; // provider is logged in
    const { title, description, price, category, images } = req.body;

    const listing = await Listing.create({
      providerId,
      title,
      description,
      price,
      category,
      images,
    });

    res.json({ success: true, message: "Listing created", listing });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ------------------ Update Listing (Provider) ------------------
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    // Only provider who created can update
    if (listing.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, price, category, images, isActive } = req.body;
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price || listing.price;
    listing.category = category || listing.category;
    listing.images = images || listing.images;
    if (isActive !== undefined) listing.isActive = isActive;

    await listing.save();
    res.json({ success: true, message: "Listing updated", listing });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ------------------ Delete Listing (Provider) ------------------
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    listing.isActive = false; // soft delete
    await listing.save();

    res.json({ success: true, message: "Listing deleted (soft)" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ------------------ Get All Listings (Customer View) ------------------
exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find({ isActive: true });
    res.json(listings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ------------------ Get Single Listing ------------------
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || !listing.isActive) return res.status(404).json({ message: "Listing not found" });

    res.json(listing);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ------------------ Search & Filter Listings (Customer) ------------------
exports.searchListings = async (req, res) => {
  try {
    let { query, category, minPrice, maxPrice, sortBy } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };

    // Sorting
    const sortOptions = {};
    if (sortBy === "price_asc") sortOptions.price = 1;
    else if (sortBy === "price_desc") sortOptions.price = -1;
    else if (sortBy === "newest") sortOptions.createdAt = -1;

    const listings = await Listing.find(filter).sort(sortOptions);
    res.json({ success: true, listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.checkAvailability = async (req, res) => {
  try {
    const { listingId, eventDate, startTime, endTime } = req.body;

    const conflictingBooking = await Booking.findOne({
      listingId,
      eventDate: new Date(eventDate),
      status: { $in: ["CREATED", "AWAITING_PAYMENT", "ACCEPTED"] },
      $expr: {
        $and: [
          { $lt: ["$timeSlot.startTime", endTime] },
          { $gt: ["$timeSlot.endTime", startTime] }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({
        available: false,
        message: "Selected time slot is not available"
      });
    }

    res.json({ available: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};


// ------------------ Get Provider Listings ------------------
exports.getMyListings = async (req, res) => {
  try {
  

    const providerId =
      req.user.id || req.user._id || req.user.userId;

    const listings = await Listing.find({ providerId });

    res.json({
      success: true,
      listings,
    });
  } catch (error) {
    console.error("GET MY LISTINGS ERROR 👉", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
