const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load backend .env explicitly
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { getMongoUri } = require("../utils/db");
const Batch = require("../models/Batch");
const User = require("../models/User");

const emailArg = process.argv[2];
if (!emailArg) {
  console.error(
    "Usage: node scripts/create_user_for_batch.js <teamLeaderEmail>",
  );
  process.exit(1);
}

const rawInput = emailArg.trim();
const normalized = rawInput.includes("@") ? rawInput.toLowerCase() : rawInput;

(async () => {
  try {
    const uri = getMongoUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    const batch = await Batch.findOne({ teamLeaderEmail: normalized }).lean();
    if (!batch) {
      console.log(`No batch found with teamLeaderEmail: ${emailArg}`);
      process.exit(0);
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalized }, { rollNo: batch.teamLeaderRollNo }],
    });
    if (existingUser) {
      console.log(
        "User already exists:",
        existingUser.email || existingUser.rollNo,
      );
      process.exit(0);
    }

    const newUser = new User({
      name: batch.teamLeaderName || "Student",
      email: batch.teamLeaderEmail,
      rollNo: batch.teamLeaderRollNo || undefined,
      role: "student",
      isActive: true,
    });

    await newUser.save();
    console.log(
      "Created user:",
      JSON.stringify(
        { id: newUser._id, email: newUser.email, rollNo: newUser.rollNo },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error("Error creating user for batch:", err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
