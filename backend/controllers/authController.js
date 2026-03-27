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

// Escape user input for safe regex usage
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Send OTP
const sendOtp = async (req, res) => {
  try {
    console.log("[/api/auth/send-otp] request body:", req.body);
    const { emailOrRollNo } = req.body;

    if (!emailOrRollNo || emailOrRollNo.trim() === "") {
      return res.status(400).json({ message: "Email or roll number required" });
    }

    // Normalize input: trim. For emails use exact lowercase match; for rollNo use case-insensitive match
    const rawInput = emailOrRollNo.trim();
    const normalizedEmail = rawInput.includes("@")
      ? rawInput.toLowerCase()
      : null;

    let user;
    if (normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      const q = {
        rollNo: { $regex: `^${escapeRegex(rawInput)}$`, $options: "i" },
      };
      user = await User.findOne(q);

      // Fallback: if no User found by rollNo, try to find a Batch with matching teamLeaderRollNo
      // and ensure a corresponding User exists (created if missing). This helps when
      // batches were added without creating a student user earlier.
      if (!user) {
        console.log(
          `[/api/auth/send-otp] no user by rollNo, trying Batch fallback for: ${rawInput}`,
        );
        const batch = await Batch.findOne({
          teamLeaderRollNo: { $regex: `^${escapeRegex(rawInput)}$`, $options: "i" },
        });
        if (batch) {
          // try find user by email from batch
          user = await User.findOne({ email: batch.teamLeaderEmail });
          if (!user) {
            // create a student user record so OTP flow continues
            const newUser = new User({
              name: batch.teamLeaderName,
              email: batch.teamLeaderEmail.toLowerCase(),
              rollNo: batch.teamLeaderRollNo || undefined,
              role: "student",
              isActive: true,
            });
            try {
              await newUser.save();
              user = newUser;
              console.log(`✅ Created user from batch for ${newUser.email}`);
            } catch (createErr) {
              console.error("Error creating user from batch fallback:", createErr);
            }
          } else if (!user.rollNo && batch.teamLeaderRollNo) {
            user.rollNo = batch.teamLeaderRollNo;
            try {
              await user.save();
            } catch (upErr) {
              console.error("Error updating user.rollNo from batch:", upErr);
            }
          }
        }
      }
    }

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
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
      // don't fail the whole flow for email errors; still return success
    }

    return res.json({
      message: "OTP sent successfully to your email",
      email: user.email,
    });
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
    console.log("[/api/auth/verify-otp] request body:", req.body);
    const { emailOrRollNo, otp } = req.body;

    if (!emailOrRollNo || !otp) {
      return res.status(400).json({ message: "Email/rollNo and OTP required" });
    }

    // Normalize input similar to sendOtp: for emails use exact lowercase match; for rollNo use case-insensitive match
    const rawInput = emailOrRollNo.trim();
    const normalizedEmail = rawInput.includes("@")
      ? rawInput.toLowerCase()
      : null;

    let user;
    if (normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      const q = {
        rollNo: { $regex: `^${escapeRegex(rawInput)}$`, $options: "i" },
      };
      user = await User.findOne(q);

      // Fallback: if no User found by rollNo, try Batch and create/find corresponding User
      if (!user) {
        console.log(`[/api/auth/verify-otp] no user by rollNo, trying Batch fallback for: ${rawInput}`);
        const batch = await Batch.findOne({
          teamLeaderRollNo: { $regex: `^${escapeRegex(rawInput)}$`, $options: "i" },
        });
        if (batch) {
          user = await User.findOne({ email: batch.teamLeaderEmail });
          if (!user) {
            const newUser = new User({
              name: batch.teamLeaderName,
              email: batch.teamLeaderEmail.toLowerCase(),
              rollNo: batch.teamLeaderRollNo || undefined,
              role: "student",
              isActive: true,
            });
            try {
              await newUser.save();
              user = newUser;
              console.log(`✅ Created user from batch for verify flow: ${newUser.email}`);
            } catch (createErr) {
              console.error("Error creating user from batch in verify flow:", createErr);
            }
          } else if (!user.rollNo && batch.teamLeaderRollNo) {
            user.rollNo = batch.teamLeaderRollNo;
            try {
              await user.save();
            } catch (upErr) {
              console.error("Error updating user.rollNo from batch in verify flow:", upErr);
            }
          }
        }
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is set
    if (!user.otp) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please request a new one" });
    }

    // Check if OTP has expired
    if (user.otpExpires < Date.now()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one" });
    }

    // Compare OTP
    const isOtpValid = await user.compareOtp(otp);
    if (!isOtpValid) {
      console.warn(`❌ Invalid OTP attempt for ${user.email}`);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log(`✅ User ${user.email} verified successfully`);

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
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendOtp, verifyOtp, otpLimiter };
