const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getMongoUri } = require('../utils/db');
const User = require('../models/User');

const email = process.argv[2];
const otp = process.argv[3] || '123456';

if (!email) {
  console.error('Usage: node set_otp.js user@example.com [otp]');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(getMongoUri());
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error('User not found:', email);
      process.exit(2);
    }

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    console.log(`✅ Set OTP for ${email} -> ${otp}`);
    process.exit(0);
  } catch (err) {
    console.error('Error setting OTP:', err);
    process.exit(1);
  }
})();
