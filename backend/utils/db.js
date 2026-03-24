const mongoose = require("mongoose");
const getMongoUri = () => {
  let uri = process.env.MONGODB_URI?.trim();
  if (!uri || uri.includes("your_mongodb_connection_string_here")) {
    uri = "mongodb://localhost:27017/reviewslotbooking";
    console.log(`📍 Using local fallback MongoDB URI (ignored placeholder)`);
  } else if (!uri.match(/^mongodb(s?:\/\/)/)) {
    uri = "mongodb://" + uri;
    console.log("📍 Added mongodb:// scheme to URI");
  }
  const redacted = uri.replace(/\/\/[^@\/]*:[^@]*@/, "//****:****@");
  console.log(`🔗 Connecting to MongoDB: ${redacted}`);
  return uri;
};
module.exports = { getMongoUri };
