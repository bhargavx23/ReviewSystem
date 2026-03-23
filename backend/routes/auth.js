const express = require("express");
const {
  sendOtp,
  verifyOtp,
  otpLimiter,
} = require("../controllers/authController");

const router = express.Router();

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;
