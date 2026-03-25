const mongoose = require("mongoose");
const User = require("./models/User");
const Settings = require("./models/Settings");
const Batch = require("./models/Batch");
const { getMongoUri } = require("./utils/db");

require("dotenv").config();

async function run() {
  try {
    await mongoose.connect(getMongoUri());
    console.log("🔗 MongoDB Connected - Removing seeded data...");

    const userEmails = [
      "bhargavpasupuleti5@gmail.com",
      "hemaswarupbande5@gmail.com",
      "ssnb240@gmail.com",
      "qwerty1234567890siva@gmail.com",
    ];

    const { deletedCount: usersDeleted } = await User.deleteMany({
      email: { $in: userEmails },
    });
    console.log(`🗑️ Removed users: ${usersDeleted}`);

    const { deletedCount: batchesDeleted } = await Batch.deleteMany({
      batchName: "Batch A",
    });
    console.log(`🗑️ Removed batches: ${batchesDeleted}`);

    // Remove all Settings documents that look like default seed (safe to remove)
    const { deletedCount: settingsDeleted } = await Settings.deleteMany({});
    console.log(`🗑️ Removed settings documents: ${settingsDeleted}`);

    console.log("✅ Unseeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Unseed error:", err);
    process.exit(1);
  }
}

run();
