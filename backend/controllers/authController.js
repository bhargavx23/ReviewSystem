const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/email");
const crypto = require("crypto");

const rateLimit = require("express-rate-limit");

// Rate limit for OTP (5 per 15min)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many OTP requests",
});

// Generate 6 digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { emailOrRollNo } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrRollNo }, { rollNo: emailOrRollNo }],
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    await sendOtpEmail(user.email, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP and generate JWT
const verifyOtp = async (req, res) => {
  try {
    const { emailOrRollNo, otp } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrRollNo }, { rollNo: emailOrRollNo }],
    });

    if (
      !user ||
      !(await user.compareOtp(otp)) ||
      user.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendOtp, verifyOtp, otpLimiter };
