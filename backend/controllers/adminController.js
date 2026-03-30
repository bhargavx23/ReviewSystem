const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Booking = require("../models/Booking");
const Settings = require("../models/Settings");
const { sendBookingEmail, sendOtpEmail } = require("../utils/email");

// Create user (admin only) - FIXED
const createUser = async (req, res) => {
  try {
    const { name, email, rollNo, role } = req.body;

    // Trim and validate
    if (!name?.trim() || !email?.trim() || !rollNo?.trim() || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedRoll = rollNo.trim().toUpperCase();
    const existingUser = await User.findOne({
      $or: [{ email: email.trim().toLowerCase() }, { rollNo: normalizedRoll }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: `User exists: ${existingUser.email || existingUser.rollNo}`,
      });
    }

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rollNo: normalizedRoll,
      role,
      isActive: true,
    });
    await user.save();

    console.log(`✅ Created user: ${user.name} (${user.role})`);

    res.status(201).json(user);
  } catch (err) {
    console.error("❌ createUser error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create batch - FIXED with full validation
const createBatch = async (req, res) => {
  try {
    const {
      batchName,
      projectTitle,
      teamLeaderName,
      teamLeaderEmail,
      teamLeaderRollNo,
      guideId,
      section,
    } = req.body;

    // Required fields validation
    if (
      !batchName?.trim() ||
      !projectTitle?.trim() ||
      !teamLeaderName?.trim() ||
      !teamLeaderEmail?.trim()
    ) {
      return res.status(400).json({
        message:
          "batchName, projectTitle, teamLeaderName, teamLeaderEmail are required",
      });
    }

    if (!guideId || !mongoose.Types.ObjectId.isValid(guideId)) {
      return res
        .status(400)
        .json({ message: "Valid guideId (ObjectId) is required" });
    }

    // Check guide exists and active
    const guide = await User.findOne({
      _id: guideId,
      role: "guide",
      isActive: true,
    });
    if (!guide) {
      return res.status(404).json({ message: "Active guide not found" });
    }

    const batchData = {
      batchName: batchName.trim(),
      projectTitle: projectTitle.trim(),
      teamLeaderName: teamLeaderName.trim(),
      teamLeaderEmail: teamLeaderEmail.trim().toLowerCase(),
      teamLeaderRollNo: teamLeaderRollNo?.trim().toUpperCase() || "",
      guideId: guide._id,
      section: section?.trim() || "",
      isActive: true,
    };

    // Check duplicate batchName
    const existingBatch = await Batch.findOne({
      batchName: batchData.batchName,
    });
    if (existingBatch) {
      return res.status(400).json({ message: "Batch name already exists" });
    }

    // Ensure the team leader exists as a user (students need to be present for OTP/login flows)
    const existingTeamLeader = await User.findOne({
      email: batchData.teamLeaderEmail,
    });
    if (!existingTeamLeader) {
      // If roll number provided, ensure it's not already used by someone else
      if (batchData.teamLeaderRollNo) {
        const rollConflict = await User.findOne({ rollNo: batchData.teamLeaderRollNo });
        if (rollConflict) {
          return res
            .status(400)
            .json({ message: "Team leader roll number already in use" });
        }
      }

      const newStudent = new User({
        name: batchData.teamLeaderName,
        email: batchData.teamLeaderEmail,
        rollNo: batchData.teamLeaderRollNo || undefined,
        role: "student",
        isActive: true,
      });

      // Generate OTP for team leader so they can login immediately
      const otp = crypto.randomInt(100000, 999999).toString();
      newStudent.otp = otp;
      newStudent.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      await newStudent.save();
      try {
        await sendOtpEmail(newStudent.email, otp);
      } catch (e) {
        console.error("Error sending OTP at batch creation:", e?.message || e);
      }
      console.log(`✅ Created student user for team leader: ${newStudent.email}`);
    }

    const batch = new Batch(batchData);
    await batch.save();
    await batch.populate("guideId", "name email");

    console.log(`✅ Created batch: ${batch.batchName} → Guide: ${guide.name}`);

    res.status(201).json(batch);
  } catch (err) {
    console.error("❌ createBatch error:", err);
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

// Get settings - FIXED with proper defaults for review settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create with sensible defaults for review period
      settings = new Settings({
        reviewStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        reviewEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        slotsPerDay: 10,
        totalBatches: 51,
        totalGuides: 20,
      });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error("❌ getSettings error:", err);
    res.status(500).json({ message: err.message });
  }
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
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log(`✅ Booking deleted: ${id}`);
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ message: err.message });
  }
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

// Update batch
const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      batchName,
      projectTitle,
      teamLeaderName,
      teamLeaderEmail,
      teamLeaderRollNo,
      guideId,
      section,
    } = req.body;

    if (!id) return res.status(400).json({ message: "Batch ID required" });

    // Validate guide if provided
    if (guideId && !mongoose.Types.ObjectId.isValid(guideId)) {
      return res.status(400).json({ message: "Invalid guideId" });
    }

    if (guideId) {
      const guide = await User.findOne({ _id: guideId, role: "guide" });
      if (!guide) return res.status(404).json({ message: "Guide not found" });
    }

    const update = {};
    if (batchName) update.batchName = batchName.trim();
    if (projectTitle) update.projectTitle = projectTitle.trim();
    if (teamLeaderName) update.teamLeaderName = teamLeaderName.trim();
    if (teamLeaderEmail)
      update.teamLeaderEmail = teamLeaderEmail.trim().toLowerCase();
    if (teamLeaderRollNo !== undefined)
      update.teamLeaderRollNo = teamLeaderRollNo?.trim().toUpperCase() || "";
    if (guideId !== undefined) update.guideId = guideId || null;
    if (section !== undefined) update.section = section?.trim() || "";

    const batch = await Batch.findByIdAndUpdate(id, update, {
      new: true,
    }).populate("guideId", "name email");

    if (!batch) return res.status(404).json({ message: "Batch not found" });

    console.log(`✅ Batch updated: ${batch.batchName} (${id})`);
    res.json(batch);
  } catch (err) {
    console.error("❌ updateBatch error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete batch
const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const batch = await Batch.findByIdAndDelete(id);

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Also delete all bookings associated with this batch
    await Booking.deleteMany({ batchId: id });

    console.log(`✅ Batch deleted: ${id}`);
    res.json({ message: "Batch deleted successfully" });
  } catch (err) {
    console.error("Error deleting batch:", err);
    res.status(500).json({ message: err.message });
  }
};

// HOD Approve booking (admin approval)
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
  updateBatch,
  deleteBatch,
  generateReportAPI,
  getSettings,
  updateSettings,
  getAllBookings,
  getGuides,
  deleteBooking,
};
