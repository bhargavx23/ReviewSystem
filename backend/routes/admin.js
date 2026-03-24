const express = require("express");
const { auth, roleAuth } = require("../controllers/middleware/auth");
const {
  createUser,
  createBatch,
  assignGuidesToBatches,
  getSettings,
  updateSettings,
  getAllBookings,
  deleteBooking,
  getBatches,
  getGuides,
  deleteBatch,
  approveBookingHOD,
  rejectBookingHOD,
  generateReportAPI,
} = require("../controllers/adminController");

const router = express.Router();

router.use(auth);
router.use(roleAuth(["admin"]));

// Users
router.post("/users", createUser);

// Batches
router.post("/batches", createBatch);
router.get("/guides", getGuides);
router.post("/assign-guides", assignGuidesToBatches);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

// Bookings
router.get("/bookings", getAllBookings);
router.delete("/bookings/:id", deleteBooking);

// New routes
router.get("/batches", getBatches);
router.delete("/batches/:id", deleteBatch);
router.put("/bookings/:id/approve-hod", approveBookingHOD);
router.put("/bookings/:id/reject-hod", rejectBookingHOD);
router.get("/reports", generateReportAPI);

module.exports = router;
