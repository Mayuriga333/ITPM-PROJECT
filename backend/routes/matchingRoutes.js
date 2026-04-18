const express = require("express");
const router = express.Router();
const { getMatchedVolunteers } = require("../controllers/matchingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, getMatchedVolunteers);

module.exports = router;
