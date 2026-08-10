/**
 * Run with: npm run seed:admin
 * Creates (or promotes) a default admin account for first-time setup.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

(async () => {
  await connectDB();
  const email = process.env.SEED_ADMIN_EMAIL || "admin@aicodeanalyzer.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  let admin = await User.findOne({ email });
  if (admin) {
    admin.role = "admin";
    await admin.save();
    console.log(`[seed] Existing user promoted to admin: ${email}`);
  } else {
    admin = await User.create({ name: "Admin", email, password, role: "admin" });
    console.log(`[seed] Admin created: ${email} / ${password} (change this password immediately)`);
  }
  await mongoose.disconnect();
  process.exit(0);
})();
