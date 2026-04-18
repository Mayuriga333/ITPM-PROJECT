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
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { uploadReviewAttachment } = require("../middleware/upload");

// Public
router.get("/volunteer/:volunteerId", getVolunteerReviews);

// Student (authenticated)
router.post("/", protect, uploadReviewAttachment.single("attachment"), createReview);

// Admin
router.get("/admin/stats", protect, authorizeRoles('Admin'), getModerationStats);
router.get("/admin/all", protect, authorizeRoles('Admin'), getAllReviews);
router.put("/admin/bulk-moderate", protect, authorizeRoles('Admin'), bulkModerate);
router.post("/admin/check-content", protect, authorizeRoles('Admin'), checkContent);
router.get("/flagged", protect, authorizeRoles('Admin'), getFlaggedReviews);
router.put("/:id/moderate", protect, authorizeRoles('Admin'), moderateReview);

module.exports = router;
