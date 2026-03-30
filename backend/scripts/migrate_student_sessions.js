/*
Migration script: convert legacy `studentLoggedIn` boolean to `studentSession` object.
Usage:
  node scripts/migrate_student_sessions.js
This will:
 - For any Batch doc with `studentLoggedIn` field, unset it and set `studentSession` to { id: null, expires: null }
 - Print summary counts.
*/

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Batch = require("../models/Batch");

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to DB");

  // Find documents with legacy field
  const legacyCount = await Batch.countDocuments({
    studentLoggedIn: { $exists: true },
  });
  console.log(
    `Found ${legacyCount} batch(es) with legacy studentLoggedIn field`,
  );

  if (legacyCount === 0) {
    console.log("Nothing to migrate. Exiting.");
    await mongoose.disconnect();
    process.exit(0);
  }

  const res = await Batch.updateMany(
    { studentLoggedIn: { $exists: true } },
    {
      $unset: { studentLoggedIn: "" },
      $set: { "studentSession.id": null, "studentSession.expires": null },
    },
  );

  console.log("Migration result:", res);
  await mongoose.disconnect();
  console.log("Disconnected. Migration complete.");
}

run().catch((err) => {
  console.error("Migration failed", err);
  process.exit(2);
});
