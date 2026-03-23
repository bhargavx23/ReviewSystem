const express = require("express");
const { auth, roleAuth } = require("../middleware/auth");
const {
  getStudentBatch,
  bookSlot,
  getAllBatches,
} = require("../controllers/studentController");

const router = express.Router();

router.use(auth);
router.use(roleAuth(["student"]));

router.get("/batches", getAllBatches);
router.get("/my-batch", getStudentBatch);
router.post("/book-slot", bookSlot);

module.exports = router;
