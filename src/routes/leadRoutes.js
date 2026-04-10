const router = require("express").Router();
const auth = require("../middlewares/authMiddlewares");
const leadCtrl = require("../controllers/leadController");

// Customer submits inquiry
router.post("/", auth(["customer"]), leadCtrl.createLead);

// Customer sees own inquiries
router.get("/my", auth(["customer"]), leadCtrl.getMyLeads);
router.get("/:id", auth(["customer"]), leadCtrl.getMyLeadDetails);

//router.get("/admin", auth(["admin"]), leadCtrl.getAllLeadsAdminn);

// Vendor sees his leads
router.get("/vendor",auth(["vendor"]),leadCtrl.getVendorLeads);



router.get("/admin/all-leads", auth(["admin"]), leadCtrl.getAllLeadsAdmin);

router.get("/admin/:id", auth(["admin"]), leadCtrl.getLeadDetailsAdmin);

router.put("/admin/:id/status", auth(["admin"]), leadCtrl.updateLeadStatus);

router.put("/admin/:id/note", auth(["admin"]), leadCtrl.addNote);

router.post("/:id/message", auth(["customer", "vendor","admin"]), leadCtrl.sendMessage);

module.exports = router;