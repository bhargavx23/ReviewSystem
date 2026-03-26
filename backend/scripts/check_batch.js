const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load backend .env explicitly
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { getMongoUri } = require("../utils/db");
const Batch = require("../models/Batch");

const emailArg = process.argv[2];
if (!emailArg) {
  console.error("Usage: node scripts/check_batch.js <teamLeaderEmail>");
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

    const batches = await Batch.find({ teamLeaderEmail: normalized }).lean();

    if (!batches || batches.length === 0) {
      console.log(`No batches found with teamLeaderEmail: ${emailArg}`);
    } else {
      console.log(`Found ${batches.length} batch(es):`);
      console.log(JSON.stringify(batches, null, 2));
    }
  } catch (err) {
    console.error("Error checking batches:", err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
