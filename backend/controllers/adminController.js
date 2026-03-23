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

module.exports = {
  createUser,
  createBatch,
  assignGuidesToBatches,
  getSettings,
  updateSettings,
  getAllBookings,
  deleteBooking,
};
