require('dotenv').config();
const mongoose = require('mongoose');
const { getMongoUri } = require('../utils/db');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(getMongoUri());
    const byEmail = await User.findOne({ email: 'qwerty1234567890siva@gmail.com' });
    const byRoll = await User.findOne({ rollNo: 'STU001' });
    console.log('By email:', byEmail ? byEmail.email : 'not found');
    console.log('By roll STU001:', byRoll ? byRoll.email : 'not found');
    const byLowerRoll = await User.findOne({ rollNo: 'stu001' });
    console.log('By roll stu001:', byLowerRoll ? byLowerRoll.email : 'not found');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
