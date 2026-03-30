const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    // OTP fields for team leader (student) login
    otp: { type: String },
    otpExpires: { type: Date },
    // studentSession stores active session id and expiry to support single-session semantics
    studentSession: {
      id: { type: String, default: null },
      expires: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

// Hash OTP before saving when set
batchSchema.pre("save", async function (next) {
  if (this.isModified("otp") && this.otp) {
    try {
      this.otp = await bcrypt.hash(this.otp.toString(), 10);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Compare OTP helper
batchSchema.methods.compareOtp = async function (candidateOtp) {
  if (!this.otp) return false;
  return bcrypt.compare(candidateOtp.toString(), this.otp);
};

module.exports = mongoose.model("Batch", batchSchema);
