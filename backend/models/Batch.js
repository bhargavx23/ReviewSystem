const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchName: { type: String, required: true },
    projectTitle: { type: String, required: true },
    teamLeaderName: { type: String, required: true },
    teamLeaderEmail: { type: String, required: true },
    teamLeaderRollNo: { type: String },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    section: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Batch", batchSchema);
