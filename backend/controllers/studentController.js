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

    // Get student bookings (multiple)
    const bookings = await Booking.find({
      batchId: batch._id,
      status: { $in: ["pending", "approved"] },
    });

    res.json({ batch, bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Book slot
const bookSlot = async (req, res) => {
  try {
    const { date: dateStr, slotNumber, batchId } = req.body;

    // Ensure date is valid
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Get settings (create if none exists)
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        reviewStartDate: new Date(),
        reviewEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        slotsPerDay: 10,
      });
      await settings.save();
    }

    const startDate = new Date(settings.reviewStartDate);
    const endDate = new Date(settings.reviewEndDate);

    // Validate date range (proper Date comparison)
    if (date < startDate || date > endDate) {
      return res.status(400).json({
        message: `Date out of allowed range (${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]})`,
      });
    }

    // Validate slot number
    if (slotNumber < 1 || slotNumber > settings.slotsPerDay) {
      return res.status(400).json({
        message: `Slot must be between 1 and ${settings.slotsPerDay}`,
      });
    }

    // Normalize booking date for same-day comparisons (ignore time components)
    const bookingDate = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const bookingDateEnd = new Date(bookingDate);
    bookingDateEnd.setUTCHours(23, 59, 59, 999);

    // Check slot availability for this date via range query
    const existingSlot = await Booking.findOne({
      date: { $gte: bookingDate, $lte: bookingDateEnd },
      slotNumber,
      status: { $nin: ["rejected"] },
    });

    if (existingSlot) {
      return res.status(400).json({ message: "Slot already taken" });
    }

    // Check if student already has approved booking (NEW)
    const existingApproved = await Booking.findOne({
      studentId: req.user._id,
      status: "approved",
    });
    if (existingApproved) {
      return res.status(400).json({
        message: "Cannot book another slot. Your previous booking is approved.",
      });
    }

    // Prevent multiple bookings by same student on same day
    const existingStudentDailyBooking = await Booking.findOne({
      studentId: req.user._id,
      date: { $gte: bookingDate, $lte: bookingDateEnd },
      status: { $nin: ["rejected"] },
    });

    if (existingStudentDailyBooking) {
      return res
        .status(400)
        .json({ message: "You can only book one slot per day" });
    }

    // Find batch
    let batch;
    if (batchId) {
      batch = await Batch.findById(batchId).populate("guideId", "name email");
      if (!batch) {
        return res.status(404).json({ message: "Specified batch not found" });
      }
    } else {
      batch = await Batch.findOne({
        $or: [
          { teamLeaderEmail: req.user.email },
          { teamLeaderRollNo: req.user.rollNo },
        ],
      }).populate("guideId", "name email");
      if (!batch) {
        return res.status(404).json({ message: "Your batch not found" });
      }
    }

    if (!batch.guideId) {
      return res.status(400).json({ message: "Batch has no assigned guide" });
    }

    // Create booking (store normalized date-only timestamp)
    const booking = new Booking({
      batchId: batch._id,
      date: bookingDate,
      slotNumber,
      studentId: req.user._id,
      guideId: batch.guideId._id,
      status: "pending",
    });

    await booking.save();

    // Notify guide
    if (batch.guideId.email) {
      await sendBookingEmail(batch.guideId.email, "booked", {
        batchName: batch.batchName,
        date: dateStr,
        slotNumber,
        studentName: req.user.name,
      }).catch(console.error);
    }

    // Notify admins
    const admins = await User.find({ role: "admin", isActive: true });
    for (const admin of admins) {
      await sendBookingEmail(admin.email, "admin-notify", {
        batchName: batch.batchName,
        date: dateStr,
        slotNumber,
        studentName: req.user.name,
      }).catch(console.error);
    }

    console.log(
      `✅ Slot booked: ${dateStr} Slot ${slotNumber} for batch ${batch.batchName}`,
    );

    res.status(201).json({
      message: "✅ Slot booked successfully - pending approval",
      booking,
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({
      message: "Booking failed. Please check date range and try again.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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

const getGuideBookings = async (req, res) => {
  try {
    // Find student's batch and guide
    const batch = await Batch.findOne({
      $or: [
        { teamLeaderEmail: req.user.email },
        { teamLeaderRollNo: req.user.rollNo },
      ],
    }).populate("guideId", "name email");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const settings = await Settings.findOne();
    const startDate = settings?.reviewStartDate;
    const endDate = settings?.reviewEndDate;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Review dates not configured" });
    }

    // Get all bookings for this guide in date range
    const guideBookings = await Booking.find({
      guideId: batch.guideId._id,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("batchId", "batchName")
      .populate("studentId", "name")
      .sort({ date: 1, slotNumber: 1 });

    res.json({
      bookings: guideBookings,
      settings: { reviewStartDate: startDate, reviewEndDate: endDate },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStudentBatch,
  bookSlot,
  getAllBatches,
  getGuideBookings,
};
