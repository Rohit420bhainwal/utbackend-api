const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json"); // same folder

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase initialized");
}

module.exports = admin;