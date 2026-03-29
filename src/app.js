// src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Razorpay webhook MUST come before express.json()
//app.use("/api/v1/bookings/webhook/razorpay",express.raw({ type: "application/json" }));

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// ✅ Routes
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/customer", require("./routes/customerRoutes"));
app.use("/api/v1/provider", require("./routes/providerRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));

app.use("/api/v1/listings", require("./routes/listingRoutes"));
//app.use("/api/v1/bookings", require("./routes/bookingRoutes"));
app.use("/api/v1/leads", require("./routes/leadRoutes"));
app.use("/api/v1/categories", require("./routes/categoryRoutes"));

app.use("/api/v1/vendors", require("./routes/vendorRoutes"));

app.use("/api/v1/services", require("./routes/serviceRoutes"));

app.use("/api/v1/users", require("./routes/userRoutes"));

app.use("/api/v1/dashboard", require("./routes/dashboardRoutes"));

app.use("/api/v1/cities", require("./routes/cityRoutes"))

// ✅ Health check
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "UTsave API is running" });
});

module.exports = app;
