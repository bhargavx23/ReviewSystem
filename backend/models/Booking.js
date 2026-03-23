const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    slotNumber: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Index for daily slot counting
bookingSchema.index({ date: 1, slotNumber: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
