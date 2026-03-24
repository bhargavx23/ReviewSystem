const mongoose = require("mongoose");
const User = require("./models/User");
const Settings = require("./models/Settings");
const Batch = require("./models/Batch");
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

    // Create Guide
    const guide = await User.findOne({ email: "guide@mictech.edu.in" });
    if (!guide) {
      const newGuide = new User({
        name: "Guide Teacher",
        email: "guide@mictech.edu.in",
        rollNo: "GUIDE001",
        role: "guide",
        otp: "123456",
      });
      await newGuide.save();
      console.log("✅ Guide created: guide@mictech.edu.in (OTP: 123456)");
    }

    // Create Student
    const student = await User.findOne({
      email: "qwerty1234567890siva@gmail.com",
    });
    if (!student) {
      const newStudent = new User({
        name: "Siva Student",
        email: "qwerty1234567890siva@gmail.com",
        rollNo: "STU001",
        role: "student",
        otp: "123456",
      });
      await newStudent.save();
      console.log(
        "✅ Student created: qwerty1234567890siva@gmail.com (OTP: 123456)",
      );
    }

    // Create Batch
    const existingBatch = await Batch.findOne({ batchName: "Batch A" });
    if (!existingBatch) {
      const guideUser = await User.findOne({ email: "guide@mictech.edu.in" });
      const newBatch = new Batch({
        batchName: "Batch A",
        projectTitle: "MERN Stack Project Review System",
        teamLeaderName: "Siva Student",
        teamLeaderEmail: "qwerty1234567890siva@gmail.com",
        teamLeaderRollNo: "STU001",
        guideId: guideUser._id,
      });
      await newBatch.save();
      console.log("✅ Batch created: Batch A");
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
