const express = require("express");
const { auth, roleAuth } = require("../controllers/middleware/auth");
const {
  getAssignedBatches,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  getBatchDetails,
  getAllGuideBookings,
} = require("../controllers/guideController");

const router = express.Router();

router.use(auth);
router.use(roleAuth(["guide"]));

router.get("/batches", getAssignedBatches);
router.get("/pending-bookings", getPendingBookings);
router.get("/bookings", getAllGuideBookings);
router.put("/bookings/:id/approve", approveBooking);
router.put("/bookings/:id/reject", rejectBooking);
router.get("/batches/:id", getBatchDetails);

module.exports = router;
