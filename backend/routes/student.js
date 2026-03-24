const express = require("express");
const { auth, roleAuth } = require("../controllers/middleware/auth");
const {
  getStudentBatch,
  bookSlot,
  getAllBatches,
  getGuideBookings,
} = require("../controllers/studentController");

const router = express.Router();

router.use(auth);
router.use(roleAuth(["student"]));

router.get("/batches", getAllBatches);
router.get("/my-batch", getStudentBatch);
router.post("/book-slot", bookSlot);
router.get("/guide-bookings", getGuideBookings);

module.exports = router;
