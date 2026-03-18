const express = require("express");
const router = express.Router();
const {
  createReview,
  getVolunteerReviews,
  getFlaggedReviews,
  moderateReview,
  getAllReviews,
  getModerationStats,
  bulkModerate,
  checkContent,
} = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middleware/auth");

// Public
router.get("/volunteer/:volunteerId", getVolunteerReviews);

// Student (authenticated)
router.post("/", protect, createReview);

// Admin
router.get("/admin/stats", protect, adminOnly, getModerationStats);
router.get("/admin/all", protect, adminOnly, getAllReviews);
router.put("/admin/bulk-moderate", protect, adminOnly, bulkModerate);
router.post("/admin/check-content", protect, adminOnly, checkContent);
router.get("/flagged", protect, adminOnly, getFlaggedReviews);
router.put("/:id/moderate", protect, adminOnly, moderateReview);

module.exports = router;
