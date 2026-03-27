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

// Enhanced error handling middleware - catches ObjectId cast errors
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    params: req.params,
    body: req.body,
    query: req.query,
  });

  // Specific handling for ObjectId cast errors
  if (err.name === "CastError" && err.kind === "ObjectId") {
    console.error("🔍 ObjectId Cast Error Details:", {
      invalidValue: err.value,
      path: err.path,
      fullUrl: req.originalUrl,
    });
    return res.status(400).json({
      message: `Invalid ID "${err.value}" for ${err.path || "model"}. Use 24-char ObjectId.`,
      error: "CastError",
      invalidValue: err.value,
    });
  }

  res.status(500).json({
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = server;
