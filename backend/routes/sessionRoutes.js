const express = require("express");
const router = express.Router();
const {
  createSession,
  getMySessions,
  updateSessionStatus,
  confirmCompletion,
  getSessionById,
} = require("../controllers/sessionController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createSession);
router.get("/", protect, getMySessions);
router.get("/:id", protect, getSessionById);
router.put("/:id/status", protect, updateSessionStatus);
router.put("/:id/complete", protect, confirmCompletion);

module.exports = router;
