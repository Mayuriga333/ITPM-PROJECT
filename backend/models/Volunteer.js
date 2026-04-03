const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    subjects: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    availability: {
      monday: { from: String, to: String, available: { type: Boolean, default: false } },
      tuesday: { from: String, to: String, available: { type: Boolean, default: false } },
      wednesday: { from: String, to: String, available: { type: Boolean, default: false } },
      thursday: { from: String, to: String, available: { type: Boolean, default: false } },
      friday: { from: String, to: String, available: { type: Boolean, default: false } },
      saturday: { from: String, to: String, available: { type: Boolean, default: false } },
      sunday: { from: String, to: String, available: { type: Boolean, default: false } },
    },
    // Rating & Reputation
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    ratingBreakdown: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 },
    },
    reputationScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    // Session stats
    completedSessions: {
      type: Number,
      default: 0,
    },
    totalSessionsAssigned: {
      type: Number,
      default: 0,
    },
    responseRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    totalResponses: {
      type: Number,
      default: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    // Leaderboard badges
    badges: [
      {
        type: String,
        enum: ["top_rated", "most_active", "rising_star"],
      },
    ],
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual for session completion rate
volunteerSchema.virtual("sessionCompletionRate").get(function () {
  if (this.totalSessionsAssigned === 0) return 100;
  return Math.round((this.completedSessions / this.totalSessionsAssigned) * 100);
});

volunteerSchema.set("toJSON", { virtuals: true });
volunteerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Volunteer", volunteerSchema);
