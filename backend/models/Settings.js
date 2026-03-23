const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    reviewStartDate: { type: Date, default: new Date() },
    reviewEndDate: { type: Date, default: new Date() },
    slotsPerDay: { type: Number, default: 10 },
    totalBatches: { type: Number, default: 51 },
    totalGuides: { type: Number, default: 20 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);
