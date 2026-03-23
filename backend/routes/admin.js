const express = require("express");
const { auth, roleAuth } = require("../middleware/auth");
const {
  createUser,
  createBatch,
  assignGuidesToBatches,
  getSettings,
  updateSettings,
  getAllBookings,
  deleteBooking,
} = require("../controllers/adminController");

const router = express.Router();

router.use(auth);
router.use(roleAuth(["admin"]));

// Users
router.post("/users", createUser);

// Batches
router.post("/batches", createBatch);
router.post("/assign-guides", assignGuidesToBatches);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

// Bookings
router.get("/bookings", getAllBookings);
router.delete("/bookings/:id", deleteBooking);

module.exports = router;
