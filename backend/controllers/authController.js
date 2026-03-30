const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/email");
const crypto = require("crypto");
const User = require("../models/User");
const Batch = require("../models/Batch");

const rateLimit = require("express-rate-limit");

// Rate limit for OTP (10 per 15min)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    message: "Too many OTP requests from this IP. Try again in 15 minutes.",
    retryAfter: 900, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate 6 digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP
const sendOtp = async (req, res) => {
  try {
    console.log("[/api/auth/send-otp] request body:", req.body);
    const { emailOrRollNo } = req.body;

    if (!emailOrRollNo || emailOrRollNo.trim() === "") {
      return res.status(400).json({ message: "Email or roll number required" });
    }

    // Normalize input: trim and lowercase for emails, uppercase for roll numbers
    const rawInput = emailOrRollNo.trim();
    const isEmail = rawInput.includes("@");
    const normalized = isEmail
      ? rawInput.toLowerCase()
      : rawInput.toUpperCase();

    // First try to find a regular User (admin/guide)
    let user = await User.findOne({
      $or: [{ email: normalized }, { rollNo: normalized }],
    });

    if (user && user.isActive) {
      // existing user flow (unchanged behavior)
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min
      try {
        await user.save();
      } catch (saveErr) {
        console.error("Error saving OTP to user:", saveErr);
        return res.status(500).json({ message: "Failed to set OTP on user" });
      }

      console.log(`📧 Sending OTP to ${user.email}`);
      try {
        await sendOtpEmail(user.email, otp);
      } catch (emailErr) {
        console.error("Error in sendOtpEmail:", emailErr);
      }

      return res.json({ message: "OTP sent successfully to your email" });
    }

    // If no user found, try Batch (student / team leader)
    let batch;
    if (isEmail) {
      batch = await Batch.findOne({ teamLeaderEmail: normalized });
    } else {
      batch = await Batch.findOne({ teamLeaderRollNo: normalized });
    }

    if (!batch || !batch.isActive) {
      return res.status(404).json({ message: "Batch (student) not found" });
    }

    // Always send OTP to registered email only
    const sendToEmail = batch.teamLeaderEmail.toLowerCase();
    const otp = generateOtp();
    batch.otp = otp;
    batch.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    try {
      await batch.save();
    } catch (saveErr) {
      console.error("Error saving OTP to batch:", saveErr);
      return res.status(500).json({ message: "Failed to set OTP for batch" });
    }

    console.log(`📧 Sending OTP to ${sendToEmail} (team leader)`);
    try {
      await sendOtpEmail(sendToEmail, otp);
    } catch (emailErr) {
      console.error("Error in sendOtpEmail for batch:", emailErr);
    }

    return res.json({ message: "OTP sent successfully to team leader email" });
  } catch (err) {
    console.error("Error sending OTP:", err && err.stack ? err.stack : err);
    res
      .status(500)
      .json({ message: "Internal server error while sending OTP" });
  }
};

// Verify OTP and generate JWT
const verifyOtp = async (req, res) => {
  try {
    const { emailOrRollNo, otp } = req.body;

    if (!emailOrRollNo || !otp) {
      return res.status(400).json({ message: "Email/rollNo and OTP required" });
    }

    const rawInput = emailOrRollNo.trim();
    const isEmail = rawInput.includes("@");
    const normalized = isEmail
      ? rawInput.toLowerCase()
      : rawInput.toUpperCase();

    // Try user first
    let user = await User.findOne({
      $or: [{ email: normalized }, { rollNo: normalized }],
    });

    if (user) {
      // user flow
      if (!user.otp) {
        return res
          .status(400)
          .json({ message: "No OTP found. Please request a new one" });
      }

      if (user.otpExpires < Date.now()) {
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        return res
          .status(400)
          .json({ message: "OTP expired. Please request a new one" });
      }

      const isOtpValid = await user.compareOtp(otp);
      if (!isOtpValid) {
        console.warn(`❌ Invalid OTP attempt for ${user.email}`);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        },
      );

      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Batch (student) verify
    let batch = null;
    if (isEmail) {
      batch = await Batch.findOne({ teamLeaderEmail: normalized });
    } else {
      batch = await Batch.findOne({ teamLeaderRollNo: normalized });
    }

    if (!batch) {
      return res.status(404).json({ message: "Batch (student) not found" });
    }

    if (!batch.otp) {
      return res
        .status(400)
        .json({ message: "No OTP found for batch. Please request a new one" });
    }

    if (batch.otpExpires < Date.now()) {
      batch.otp = undefined;
      batch.otpExpires = undefined;
      await batch.save();
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one" });
    }

    // Disallow login if an active session exists for this batch
    if (batch.studentSession && batch.studentSession.expires) {
      const sessExpires = new Date(batch.studentSession.expires).getTime();
      if (sessExpires > Date.now()) {
        return res
          .status(403)
          .json({ message: "This batch already has an active session" });
      }
    }

    const isOtpValid = await batch.compareOtp(otp);
    if (!isOtpValid) {
      console.warn(`❌ Invalid OTP attempt for batch ${batch._id}`);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP and create session id stored on batch
    batch.otp = undefined;
    batch.otpExpires = undefined;
    const sessionId = crypto.randomUUID();
    const sessionExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    batch.studentSession = { id: sessionId, expires: new Date(sessionExpiry) };
    await batch.save();

    const token = jwt.sign(
      { id: batch._id, role: "student", sid: sessionId },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    if (process.env.DEBUG_SESSION === "1") {
      console.log("[SESSION] issued token for batch:", token);
      console.log("[SESSION] token payload:", jwt.decode(token));
    }

    return res.json({
      token,
      user: {
        id: batch._id,
        batchName: batch.batchName,
        projectTitle: batch.projectTitle,
        teamLeaderName: batch.teamLeaderName,
        teamLeaderEmail: batch.teamLeaderEmail,
        role: "student",
      },
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: err.message });
  }
};

// Logout for student (clear studentSession)
const logout = async (req, res) => {
  try {
    // Expect Authorization header with Bearer token
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(400).json({ message: "Token required" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (decoded.role === "student") {
      // If token has sid, treat as batch session logout
      if (decoded.sid) {
        const batch = await Batch.findById(decoded.id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });
        // only clear if sid matches
        if (batch.studentSession && batch.studentSession.id === decoded.sid) {
          batch.studentSession = { id: null, expires: null };
          await batch.save();
          return res.json({ message: "Logged out" });
        }
        return res.status(400).json({ message: "Session mismatch" });
      }

      // Otherwise this is a user-based student token (no-op)
      return res.json({
        message: "Logout handled (no-op for user-based student)",
      });
    }

    // For other users, no session tracking implemented here
    return res.json({
      message: "Logout handled (no-op for non-student users)",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};

module.exports = { sendOtp, verifyOtp, otpLimiter, logout };
