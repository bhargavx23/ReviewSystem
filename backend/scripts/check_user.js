const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load backend .env explicitly
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { getMongoUri } = require("../utils/db");
const User = require("../models/User");

const emailArg = process.argv[2];
if (!emailArg) {
  console.error("Usage: node scripts/check_user.js <emailOrRollNo>");
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

    const user = await User.findOne({
      $or: [{ email: normalized }, { rollNo: normalized }],
    }).lean();

    if (!user) {
      console.log(`User not found for input: ${emailArg}`);
    } else {
      console.log("User found:");
      console.log(JSON.stringify(user, null, 2));
    }
  } catch (err) {
    console.error("Error checking user:", err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
