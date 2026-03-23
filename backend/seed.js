const mongoose = require("mongoose");
const User = require("./models/User");
const Settings = require("./models/Settings");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("🔗 MongoDB Connected - Seeding Data...");

    // Create Admin
    const admin = await User.findOne({ email: "bhargavpasupuleti5@gmail.com" });
    if (!admin) {
      const newAdmin = new User({
        name: "Admin Bhargav",
        email: "bhargavpasupuleti5@gmail.com",
        rollNo: "ADMIN001",
        role: "admin",
        otp: "123456", // Default OTP for first login
      });
      await newAdmin.save();
      console.log(
        "✅ Admin created: bhargavpasupuleti5@gmail.com (OTP: 123456)",
      );
    }

    // Default Settings
    await Settings.findOneAndUpdate(
      {},
      {
        reviewStartDate: new Date(),
        reviewEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        slotsPerDay: 10,
      },
      { upsert: true },
    );

    console.log("✅ Seeding complete! Run: npm run seed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  });
