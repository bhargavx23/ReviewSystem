const Booking = require("../models/Booking");
const Batch = require("../models/Batch");
const Settings = require("../models/Settings");
const User = require("../models/User");
const { sendBookingEmail } = require("../utils/email");

// Get student's batch
const getStudentBatch = async (req, res) => {
  try {
    // Find batch by teamLeaderEmail or rollNo matching student
    const batch = await Batch.findOne({
      $or: [
        { teamLeaderEmail: req.user.email },
        { teamLeaderRollNo: req.user.rollNo },
      ],
    }).populate("guideId", "name");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Check existing booking
    const existingBooking = await Booking.findOne({
      batchId: batch._id,
      status: { $in: ["pending", "approved"] },
    });

    res.json({ batch, existingBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book slot
const bookSlot = async (req, res) => {
  try {
    const { date, slotNumber } = req.body;
    const settings = await Settings.findOne();

    // Validate date range
    if (date < settings.reviewStartDate || date > settings.reviewEndDate) {
      return res.status(400).json({ message: "Date out of allowed range" });
    }

    // Check slot availability
    const existingSlot = await Booking.findOne({
      date,
      slotNumber,
      status: { $ne: "rejected" },
    });

    if (existingSlot) {
      return res.status(400).json({ message: "Slot already taken" });
    }

    // Find batch
    const batch = await Batch.findOne({
      $or: [
        { teamLeaderEmail: req.user.email },
        { teamLeaderRollNo: req.user.rollNo },
      ],
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Create booking
    const booking = new Booking({
      batchId: batch._id,
      date,
      slotNumber,
      studentId: req.user._id,
      guideId: batch.guideId,
    });

    await booking.save();

    // Notify guide
    const guide = await User.findById(batch.guideId);
    await sendBookingEmail(guide.email, "booked", {
      batchName: batch.batchName,
      date,
      slotNumber,
    });

    res
      .status(201)
      .json({
        message: "Slot booked successfully - pending approval",
        booking,
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all batches (for dashboard grid)
const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find({}).populate("guideId", "name").lean();

    // Add booking status for each batch
    const batchesWithStatus = await Promise.all(
      batches.map(async (batch) => {
        const booking = await Booking.findOne({
          batchId: batch._id,
          status: "approved",
        });

        let status = "not-booked";
        if (booking) status = "approved";
        else {
          const pending = await Booking.findOne({
            batchId: batch._id,
            status: "pending",
          });
          if (pending) status = "pending";
        }

        return { ...batch, status };
      }),
    );

    res.json(batchesWithStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStudentBatch,
  bookSlot,
  getAllBatches,
};
