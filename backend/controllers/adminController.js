const User = require("../models/User");
const Batch = require("../models/Batch");
const Booking = require("../models/Booking");
const Settings = require("../models/Settings");
const { sendBookingEmail } = require("../utils/email");

// Create user (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, rollNo, role } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { rollNo }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, rollNo, role });
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create batch
const createBatch = async (req, res) => {
  try {
    const batch = new Batch(req.body);
    await batch.save();
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign guide to batches (even distribution)
const assignGuidesToBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ guideId: null }).limit(51);
    const guides = await User.find({ role: "guide", isActive: true });

    const batchesPerGuide = Math.ceil(batches.length / guides.length);

    for (let i = 0; i < batches.length; i++) {
      const guideIndex = Math.floor(i / batchesPerGuide) % guides.length;
      batches[i].guideId = guides[guideIndex]._id;
      await batches[i].save();
    }

    res.json({ message: "Guides assigned successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get settings
const getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings();
  await settings.save();
  res.json(settings);
};

// Update settings
const updateSettings = async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
  });
  res.json(settings);
};

// Get all bookings
const getAllBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate("batchId", "batchName projectTitle teamLeaderName")
    .populate("guideId", "name")
    .populate("studentId", "name")
    .sort({ date: 1 });
  res.json(bookings);
};

// Delete booking
const deleteBooking = async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Booking deleted" });
};
// Get all guides
const getGuides = async (req, res) => {
  const guides = await User.find({ role: "guide", isActive: true }).sort({
    name: 1,
  });
  res.json(guides);
};
// Get all batches
const getBatches = async (req, res) => {
  const batches = await Batch.find()
    .populate("guideId", "name email")
    .sort({ batchName: 1 });
  res.json(batches);
};

// Delete batch
const deleteBatch = async (req, res) => {
  await Batch.findByIdAndDelete(req.params.id);
  res.json({ message: "Batch deleted" });
};

// HOD Approve booking (admin approval)
const approveBookingHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOneAndUpdate(
      { _id: id, status: "pending" },
      { status: "approved" },
      { new: true },
    )
      .populate("batchId", "teamLeaderEmail batchName")
      .populate("guideId", "name");

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found or already approved" });
    }

    // Send approval email to student
    await sendBookingEmail(booking.batchId.teamLeaderEmail, "approved", {
      batchName: booking.batchId.batchName,
      date: booking.date,
      slotNumber: booking.slotNumber,
      guideName: booking.guideId?.name || "Admin",
    });

    res.json({ message: "Booking approved by HOD", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HOD Reject booking
const rejectBookingHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOneAndUpdate(
      { _id: id },
      { status: "rejected" },
      { new: true },
    ).populate("batchId", "teamLeaderEmail batchName");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Send rejection email
    await sendBookingEmail(booking.batchId.teamLeaderEmail, "rejected", {
      batchName: booking.batchId.batchName,
    });

    res.json({ message: "Booking rejected by HOD", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate report for download
const generateReportAPI = async (req, res) => {
  try {
    const { format = "json" } = req.query;
    const { generateReport } = require("../utils/reports");

    const report = await generateReport(format);

    if (format === "excel") {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=slot-bookings.xlsx",
      );
      res.send(report);
    } else if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=slot-bookings.pdf",
      );
      res.send(report);
    } else if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=slot-bookings.csv",
      );
      res.send(report);
    } else {
      res.json(report);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createUser,
  createBatch,
  assignGuidesToBatches,
  getBatches,
  deleteBatch,
  approveBookingHOD,
  rejectBookingHOD,
  generateReportAPI,
  getSettings,
  updateSettings,
  getAllBookings,
  getGuides,
  deleteBooking,
};
