const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load backend .env explicitly
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { getMongoUri } = require("../utils/db");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Booking = require("../models/Booking");

(async () => {
  try {
    const uri = getMongoUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("🔍 Connected to MongoDB - Checking ObjectId integrity...\n");

    // Check Users
    console.log("👥 Users collection:");
    const usersCount = await User.countDocuments();
    console.log(`  Total users: ${usersCount}`);

    // Sample users
    const sampleUsers = await User.find().limit(5).lean();
    console.log(
      "  Sample users IDs:",
      sampleUsers.map((u) => ({ name: u.name, id: u._id })),
    );

    // Check Batches for invalid guideId
    console.log("\n📚 Batches collection:");
    const batches = await Batch.find().lean();
    console.log(`  Total batches: ${batches.length}`);

    let invalidGuideRefs = 0;
    for (const batch of batches) {
      if (batch.guideId && !mongoose.Types.ObjectId.isValid(batch.guideId)) {
        console.log(
          `  ❌ Invalid guideId in batch "${batch.batchName}": ${batch.guideId}`,
        );
        invalidGuideRefs++;
      }
    }
    console.log(`  Invalid guideId refs: ${invalidGuideRefs}`);

    // Check Bookings
    console.log("\n📅 Bookings collection:");
    const bookingsCount = await Booking.countDocuments();
    console.log(`  Total bookings: ${bookingsCount}`);

    const sampleBookings = await Booking.find().limit(5).lean();
    console.log(
      "  Sample booking refs:",
      sampleBookings.map((b) => ({
        batchId: b.batchId,
        guideId: b.guideId,
        studentId: b.studentId,
      })),
    );

    console.log("\n✅ ObjectId integrity check complete.");
    if (invalidGuideRefs === 0) {
      console.log("   No invalid ObjectId references found.");
    } else {
      console.log(
        `   ⚠️  Found ${invalidGuideRefs} invalid refs. Consider fixing.`,
      );
    }
  } catch (err) {
    console.error("❌ Error checking DB integrity:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
