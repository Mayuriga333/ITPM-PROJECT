const express = require("express");
const router = express.Router();
const {
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  getLeaderboard,
  getMyVolunteerProfile,
} = require("../controllers/volunteerController");
const { protect } = require("../middleware/authMiddleware");

router.get("/leaderboard", getLeaderboard);
router.get("/me/profile", protect, getMyVolunteerProfile);
router.get("/", getVolunteers);
router.get("/:id", getVolunteerById);
router.put("/:id", protect, updateVolunteer);

module.exports = router;
