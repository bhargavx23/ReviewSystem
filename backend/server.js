const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");

// Load backend .env explicitly using file path relative to this file.
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes - Full API
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/guide", require("./routes/guide"));
app.use("/api/student", require("./routes/student"));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Review Slot Booking API v1.0 - Full Backend Ready",
    endpoints: {
      auth: ["POST /api/auth/send-otp", "POST /api/auth/verify-otp"],
      admin: ["POST /api/admin/users", "POST /api/admin/batches"],
      guide: ["GET /api/guide/pending-bookings"],
      student: ["POST /api/student/book-slot"],
    },
  });
});

const { getMongoUri } = require("./utils/db");

// MongoDB Connection
mongoose
  .connect(getMongoUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = server;
