const express = require("express");
const {
  sendOtp,
  verifyOtp,
  otpLimiter,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/logout", logout);

module.exports = router;
