const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNo: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["admin", "guide", "student"], required: true },
    otp: String,
    otpExpires: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Hash OTP before saving
userSchema.pre("save", async function (next) {
  if (this.otp) {
    this.otp = await bcrypt.hash(this.otp.toString(), 10);
  }
  next();
});

// Compare OTP
userSchema.methods.compareOtp = async function (candidateOtp) {
  return bcrypt.compare(candidateOtp.toString(), this.otp);
};

module.exports = mongoose.model("User", userSchema);
