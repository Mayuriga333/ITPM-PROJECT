/**
 * models/VolunteerProfile.js — Volunteer profile with moderation approval
 *
 * Approval lifecycle (separate from User.status):
 *   Pending  → profile submitted but not yet reviewed
 *   Approved → visible in student matching results
 *   Rejected → hidden from matching; volunteer notified via moderationNotes
 */

const mongoose = require('mongoose');

const VolunteerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Subjects the volunteer can teach (e.g. ['Math', 'Physics'])
    skills: {
      type: [String],
      default: [],
    },
    // Available time slots (e.g. ['Morning', 'Evening', 'Weekend'])
    availability: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 3.0,
      min: 0,
      max: 5,
    },
    bio: {
      type: String,
      maxlength: 400,
      default: '',
    },

    // ── Profile moderation (controlled by Admin) ──────────────────────────────
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    // Admin notes explaining approval or rejection
    moderationNotes: {
      type: String,
      default: '',
      maxlength: 600,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },

    // ── Flagging system ───────────────────────────────────────────────────────
    // Flags incremented when students or the system flag this profile
    flagCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
      maxlength: 400,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VolunteerProfile', VolunteerProfileSchema);