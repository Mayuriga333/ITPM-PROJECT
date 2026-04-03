const Review = require("../models/Review");
const Volunteer = require("../models/Volunteer");
const Session = require("../models/Session");
const { detectInappropriateContent } = require("../middleware/reviewModeration");
const { recalculateReputation } = require("../utils/reputationCalculator");

const TOPIC_REGEX = /^[a-zA-Z0-9\s.,!?\-_'"():;/&]+$/;
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,!?\-_'"():;/&\n\r]*$/;
const VALID_TAGS = ["positive", "neutral", "needs_improvement"];
const VALID_EXPERIENCE_TYPES = ["practice", "review", "new_learning"];

function parseBooleanExplicit(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }
  return null;
}

function parseTags(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// ============================
// Helper: Update volunteer stats
// ============================
async function updateVolunteerStats(volunteerId, rating, action) {
  const volunteer = await Volunteer.findById(volunteerId);
  if (!volunteer) return;

  const ratingMap = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five" };

  if (action === "add") {
    volunteer.ratingBreakdown[ratingMap[rating]] += 1;
    volunteer.totalReviews += 1;
  } else if (action === "remove") {
    volunteer.ratingBreakdown[ratingMap[rating]] = Math.max(
      0,
      volunteer.ratingBreakdown[ratingMap[rating]] - 1
    );
    volunteer.totalReviews = Math.max(0, volunteer.totalReviews - 1);
  }

  if (volunteer.totalReviews > 0) {
    const totalStars =
      volunteer.ratingBreakdown.five * 5 +
      volunteer.ratingBreakdown.four * 4 +
      volunteer.ratingBreakdown.three * 3 +
      volunteer.ratingBreakdown.two * 2 +
      volunteer.ratingBreakdown.one * 1;
    volunteer.averageRating = Math.round((totalStars / volunteer.totalReviews) * 10) / 10;
  } else {
    volunteer.averageRating = 0;
  }

  volunteer.reputationScore = recalculateReputation(volunteer);

  volunteer.badges = [];
  if (volunteer.averageRating >= 4.5 && volunteer.totalReviews >= 5) {
    volunteer.badges.push("top_rated");
  }
  if (volunteer.completedSessions >= 20) {
    volunteer.badges.push("most_active");
  }
  if (
    volunteer.createdAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) &&
    volunteer.averageRating >= 4.0
  ) {
    volunteer.badges.push("rising_star");
  }

  await volunteer.save();
}

// @desc    Submit a review for a completed session
// @route   POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const {
      sessionId,
      rating,
      reviewText,
      isAnonymous,
      topicStudied,
      followUpMatchAgain,
      feedbackTags,
      sessionDate,
      experienceType,
      recommendation,
    } = req.body;

    // Validate topic/subject studied
    const normalizedTopic = (topicStudied || "").trim();
    if (!normalizedTopic) {
      return res.status(400).json({ message: "Topic/Subject studied is required" });
    }
    if (normalizedTopic.length < 3 || normalizedTopic.length > 200) {
      return res.status(400).json({ message: "Topic/Subject studied must be 3-200 characters" });
    }
    if (!TOPIC_REGEX.test(normalizedTopic)) {
      return res.status(400).json({
        message: "Topic/Subject studied contains invalid characters",
      });
    }

    // Validate follow-up selection (must be explicit yes/no)
    const normalizedFollowUp = parseBooleanExplicit(followUpMatchAgain);
    if (normalizedFollowUp === null) {
      return res.status(400).json({
        message: "Follow-up action is required. Please select Yes or No.",
      });
    }

    // Validate tags
    const normalizedTags = parseTags(feedbackTags);
    if (!normalizedTags.length) {
      return res.status(400).json({ message: "At least one feedback tag is required" });
    }
    if (normalizedTags.length > 3) {
      return res.status(400).json({ message: "You can select a maximum of 3 feedback tags" });
    }
    const hasInvalidTag = normalizedTags.some((tag) => !VALID_TAGS.includes(tag));
    if (hasInvalidTag) {
      return res.status(400).json({
        message: "Invalid feedback tag selected. Allowed: Positive, Neutral, Needs Improvement",
      });
    }

    // Validate session date
    if (!sessionDate) {
      return res.status(400).json({ message: "Session date is required" });
    }
    const parsedSessionDate = new Date(sessionDate);
    if (Number.isNaN(parsedSessionDate.getTime())) {
      return res.status(400).json({ message: "Session date format is invalid" });
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedSessionDate > today) {
      return res.status(400).json({ message: "Session date cannot be in the future" });
    }
    const oldestAllowed = new Date();
    oldestAllowed.setFullYear(oldestAllowed.getFullYear() - 1);
    oldestAllowed.setHours(0, 0, 0, 0);
    if (parsedSessionDate < oldestAllowed) {
      return res.status(400).json({ message: "Session date cannot be older than 1 year" });
    }

    // Validate experience type
    if (!experienceType || !VALID_EXPERIENCE_TYPES.includes(experienceType)) {
      return res.status(400).json({
        message: "Experience type is invalid. Allowed: Practice, Review, New Learning",
      });
    }

    // Validate recommendation
    const normalizedRecommendation = (recommendation || "").trim();
    if (normalizedRecommendation.length > 500) {
      return res.status(400).json({ message: "Recommendation cannot exceed 500 characters" });
    }
    if (normalizedRecommendation && !SAFE_TEXT_REGEX.test(normalizedRecommendation)) {
      return res.status(400).json({ message: "Recommendation contains unsafe characters" });
    }

    // Validate review text safety if provided
    const normalizedReviewText = (reviewText || "").trim();
    if (normalizedReviewText && !SAFE_TEXT_REGEX.test(normalizedReviewText)) {
      return res.status(400).json({ message: "Review text contains unsafe characters" });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Validate session
    const session = await Session.findById(sessionId).populate("volunteer");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Ensure session is completed
    if (session.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed sessions" });
    }

    // Ensure the student is the one who had the session
    if (session.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to review this session" });
    }

    // Prevent duplicate reviews from same session (model also has unique index)
    const existingReview = await Review.findOne({ session: sessionId });
    if (existingReview) {
      return res.status(400).json({
        message: "A review for this session already exists. Duplicate reviews are not allowed.",
        duplicateSessionId: sessionId,
      });
    }

    // Prevent rapid review spam — same student+volunteer within 1 hour
    const volId = session.volunteer._id || session.volunteer;
    const recentReview = await Review.findOne({
      student: req.user._id,
      volunteer: volId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recentReview) {
      return res.status(400).json({
        message: "You recently reviewed this volunteer. Please wait before submitting another review.",
      });
    }

    // Run moderation check
    let reviewStatus = "approved";
    let flagReason = "";
    let moderationScore = 0;
    let moderationSeverity = null;

    if (normalizedReviewText) {
      const modResult = detectInappropriateContent(normalizedReviewText, rating);
      moderationScore = modResult.score;
      moderationSeverity = modResult.severity;

      if (modResult.autoReject) {
        reviewStatus = "rejected";
        flagReason = modResult.reasons.join("; ");
      } else if (modResult.flagged) {
        reviewStatus = "flagged";
        flagReason = modResult.reasons.join("; ");
      }
    }

    const attachment = req.file
      ? {
          fileName: req.file.originalname,
          fileUrl: `/uploads/reviews/${req.file.filename}`,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : {
          fileName: "",
          fileUrl: "",
          mimeType: "",
          size: 0,
        };

    const review = await Review.create({
      session: sessionId,
      student: req.user._id,
      volunteer: volId,
      rating,
      reviewText: normalizedReviewText,
      topicStudied: normalizedTopic,
      followUpMatchAgain: normalizedFollowUp,
      feedbackTags: normalizedTags,
      sessionDate: parsedSessionDate,
      experienceType,
      attachment,
      recommendation: normalizedRecommendation,
      subject: session.subject,
      isAnonymous: isAnonymous || false,
      status: reviewStatus,
      flagReason,
      moderationScore,
      moderationSeverity,
    });

    // Mark session as reviewed
    session.isReviewed = true;
    await session.save();

    // Update volunteer stats only if approved
    if (reviewStatus === "approved") {
      await updateVolunteerStats(volId, rating, "add");
    }

    const populatedReview = await Review.findById(review._id).populate("student", "name");

    // Return moderation feedback
    let moderationMessage = null;
    if (reviewStatus === "flagged") {
      moderationMessage =
        "Your review has been submitted for moderation. It will be visible after admin approval.";
    } else if (reviewStatus === "rejected") {
      moderationMessage =
        "Your review was automatically rejected due to policy violations. Please revise and resubmit.";
    }

    res.status(201).json({
      review: populatedReview,
      moderationStatus: reviewStatus,
      moderationMessage,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A review for this session already exists. Duplicate reviews are not allowed.",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a volunteer (public — approved only)
// @route   GET /api/reviews/volunteer/:volunteerId
exports.getVolunteerReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      volunteer: req.params.volunteerId,
      status: "approved",
    })
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      volunteer: req.params.volunteerId,
      status: "approved",
    });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews with filters (admin)
// @route   GET /api/reviews/admin/all
exports.getAllReviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = "newest" } = req.query;

    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === "oldest") sortOption = { createdAt: 1 };
    if (sortBy === "rating-high") sortOption = { rating: -1 };
    if (sortBy === "rating-low") sortOption = { rating: 1 };
    if (sortBy === "severity") sortOption = { moderationScore: -1 };

    const reviews = await Review.find(filter)
      .populate("student", "name email")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name email" },
      })
      .populate("session", "subject scheduledDate")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get moderation statistics (admin)
// @route   GET /api/reviews/admin/stats
exports.getModerationStats = async (req, res) => {
  try {
    const [totalReviews, approved, flagged, pending, rejected] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: "approved" }),
      Review.countDocuments({ status: "flagged" }),
      Review.countDocuments({ status: "pending" }),
      Review.countDocuments({ status: "rejected" }),
    ]);

    const recentFlagged = await Review.find({ status: "flagged" })
      .populate("student", "name email")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name" },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const avgResult = await Review.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const averageRating =
      avgResult.length > 0 ? Math.round(avgResult[0].avgRating * 10) / 10 : 0;

    res.json({
      totalReviews,
      approved,
      flagged,
      pending,
      rejected,
      needsAction: flagged + pending,
      averageRating,
      recentFlagged,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get flagged reviews (admin)
// @route   GET /api/reviews/flagged
exports.getFlaggedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: { $in: ["flagged", "pending"] } })
      .populate("student", "name email")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name" },
      })
      .populate("session", "subject scheduledDate")
      .sort({ moderationScore: -1, createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Moderate a review (admin) — approve or reject
// @route   PUT /api/reviews/:id/moderate
exports.moderateReview = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const previousStatus = review.status;
    review.status = status;
    if (adminNote) review.adminNote = adminNote;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    await review.save();

    // Handle volunteer stats based on status transitions
    if (status === "approved" && previousStatus !== "approved") {
      await updateVolunteerStats(review.volunteer, review.rating, "add");
    } else if (status === "rejected" && previousStatus === "approved") {
      await updateVolunteerStats(review.volunteer, review.rating, "remove");
    }

    const populatedReview = await Review.findById(review._id)
      .populate("student", "name email")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name" },
      });

    res.json({ message: `Review ${status} successfully`, review: populatedReview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk moderate reviews (admin)
// @route   PUT /api/reviews/admin/bulk-moderate
exports.bulkModerate = async (req, res) => {
  try {
    const { reviewIds, status } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ message: "Review IDs are required" });
    }
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const reviews = await Review.find({ _id: { $in: reviewIds } });
    let processed = 0;

    for (const review of reviews) {
      const previousStatus = review.status;
      review.status = status;
      review.moderatedBy = req.user._id;
      review.moderatedAt = new Date();
      await review.save();

      if (status === "approved" && previousStatus !== "approved") {
        await updateVolunteerStats(review.volunteer, review.rating, "add");
      } else if (status === "rejected" && previousStatus === "approved") {
        await updateVolunteerStats(review.volunteer, review.rating, "remove");
      }
      processed++;
    }

    res.json({ message: `${processed} reviews ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Preview content moderation (admin tool)
// @route   POST /api/reviews/admin/check-content
exports.checkContent = async (req, res) => {
  try {
    const { text, rating } = req.body;
    const result = detectInappropriateContent(text, rating || 3);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

