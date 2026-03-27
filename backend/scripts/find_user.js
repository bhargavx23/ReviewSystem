const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getMongoUri } = require('../utils/db');
const User = require('../models/User');

const id = process.argv[2];
if (!id) {
  console.error('Usage: node find_user.js <userId>');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(getMongoUri());
    const user = await User.findById(id).lean();
    if (!user) {
      console.error('User not found for id', id);
      process.exit(2);
    }
    console.log('User:', JSON.stringify(user, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching user:', err);
    process.exit(1);
  }
})();
