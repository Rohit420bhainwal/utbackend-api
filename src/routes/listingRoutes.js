const router = require("express").Router();
const auth = require("../middlewares/authMiddlewares");
const listingCtrl = require("../controllers/listingController");

// ------------------ Provider Routes ------------------
router.post("/", auth(["provider"]), listingCtrl.createListing);         // Create listing
router.put("/:id", auth(["provider"]), listingCtrl.updateListing);       // Update listing
router.delete("/:id", auth(["provider"]), listingCtrl.deleteListing);    // Delete listing
router.get(
  "/my",
  auth(["provider"]),
  listingCtrl.getMyListings
);

// ------------------ Customer Routes ------------------
router.get("/", listingCtrl.getAllListings);                              // Get all listings
router.get("/:id", listingCtrl.getListingById);                           // Get single listing
router.get("/search", listingCtrl.searchListings);     // Search & filter listings



// customer
router.post(
    "/check-availability",
    auth(["customer"]),
    listingCtrl.checkAvailability
  );


module.exports = router;
