const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Batch = require("../models/Batch");
const { sendBookingEmail } = require("../utils/email");

// Get assigned batches for guide
const getAssignedBatches = async (req, res) => {
  try {
    // fetch batches and dedupe by _id to avoid duplicates
    const batchesRaw = await Batch.find({ guideId: req.user._id })
      .sort({ batchName: 1 })
      .lean();

    const seen = new Set();
    const batches = batchesRaw.filter((b) => {
      const id = String(b._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get pending bookings for guide's batches
const getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      guideId: req.user._id,
      status: "pending",
    })
      .populate("batchId", "batchName projectTitle teamLeaderName")
      .populate("studentId", "name email")
      .sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve booking
const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOneAndUpdate(
      { _id: id, guideId: req.user._id, status: "pending" },
      { status: "approved" },
      { new: true },
    ).populate("batchId", "teamLeaderEmail batchName date slotNumber");

    // include student info for response and notifications
    await booking.populate("studentId", "name email");

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found or already processed" });
    }

    // Send approval email
    await sendBookingEmail(booking.batchId.teamLeaderEmail, "approved", {
      batchName: booking.batchId.batchName,
      date: booking.date,
      slotNumber: booking.slotNumber,
      guideName: req.user.name,
    });

    res.json({ message: "Booking approved", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject booking
const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOneAndUpdate(
      { _id: id, guideId: req.user._id },
      { status: "rejected" },
      { new: true },
    ).populate("batchId", "teamLeaderEmail");

    // include student info
    await booking?.populate("studentId", "name email");

    if (booking) {
      await sendBookingEmail(booking.batchId.teamLeaderEmail, "rejected", {});
    }

    res.json({ message: "Booking rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get specific batch details for guide (with bookings stats)
const getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    // validate id to avoid cast errors in aggregation
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid batch id" });
    }
    const batch = await Batch.findOne({
      _id: id,
      guideId: req.user._id,
    }).populate("guideId", "name email");

    if (!batch) {
      return res
        .status(404)
        .json({ message: "Batch not found or not assigned to you" });
    }

    // Get batch bookings count by status
    const bookingsCount = await Booking.aggregate([
      { $match: { batchId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };

    bookingsCount.forEach(({ _id: status, count }) => {
      counts[status] = count || 0;
    });
    // total bookings is sum of all statuses
    counts.total =
      (counts.pending || 0) + (counts.approved || 0) + (counts.rejected || 0);

    res.json({
      ...batch.toObject(),
      bookingsCount: counts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAssignedBatches,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  getBatchDetails,
};
