require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getMongoUri } = require('../utils/db');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(getMongoUri());
    const user = await User.findOne({ rollNo: 'STU001' });
    if (!user) return console.log('User not found');
    user.otp = await bcrypt.hash('123456', 10);
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    console.log('OTP set for', user.email);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
