const Booking = require("../models/Booking");
const Batch = require("../models/Batch");
const { sendBookingEmail } = require("../utils/email");

// Get assigned batches for guide
const getAssignedBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ guideId: req.user._id })
      .populate("teamLeaderRollNo", "User")
      .sort({ batchName: 1 });
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
      { status: "guide-approved" },
      { new: true },
    ).populate("batchId", "teamLeaderEmail batchName date slotNumber");

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

    if (booking) {
      await sendBookingEmail(booking.batchId.teamLeaderEmail, "rejected", {});
    }

    res.json({ message: "Booking rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAssignedBatches,
  getPendingBookings,
  approveBooking,
  rejectBooking,
};
