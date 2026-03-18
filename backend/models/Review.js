const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true, // Prevent duplicate reviews for same session
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    subject: {
      type: String,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "flagged", "rejected"],
      default: "approved",
    },
    flagReason: {
      type: String,
      default: "",
    },
    moderationScore: {
      type: Number,
      default: 0,
    },
    moderationSeverity: {
      type: String,
      enum: ["low", "medium", "high", null],
      default: null,
    },
    adminNote: {
      type: String,
      default: "",
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
reviewSchema.index({ volunteer: 1, createdAt: -1 });
reviewSchema.index({ student: 1 });

module.exports = mongoose.model("Review", reviewSchema);
