const express = require("express");
const { auth, roleAuth } = require("../controllers/middleware/auth");
const {
  getAssignedBatches,
  getPendingBookings,
  approveBooking,
  rejectBooking,
} = require("../controllers/guideController");

const router = express.Router();

router.use(auth);
router.use(roleAuth(["guide"]));

router.get("/batches", getAssignedBatches);
router.get("/pending-bookings", getPendingBookings);
router.put("/bookings/:id/approve", approveBooking);
router.put("/bookings/:id/reject", rejectBooking);

module.exports = router;
