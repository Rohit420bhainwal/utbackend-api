const app = require("./src/app");
const connectDB = require("./src/config/db");
// const cron = require("node-cron");
// const { checkPartialPayments } = require("./src/utils/bookingScheduler");

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 UTsave API running on port ${PORT}`);
});


// cron.schedule("0 * * * *", () => {
//     console.log("Running partial payment check...");
//     checkPartialPayments();
//   });
