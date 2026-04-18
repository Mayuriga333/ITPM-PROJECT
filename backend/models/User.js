/**
 * models/User.js — User schema with admin moderation support
 *
 * Status lifecycle:
 *   Student  → Approved automatically on registration
 *   Volunteer → Pending → Admin Approves or Rejects
 *   Admin    → Approved automatically
 *   Any role can be Suspended by an Admin at any time.
 *   Suspended / Rejected users cannot log in.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['Student', 'Volunteer', 'Admin'],
      required: [true, 'Role is required'],
    },

    // ── Moderation ────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending',
    },
    // Reason shown to the user on rejection or suspension
    statusReason: {
      type: String,
      default: '',
      maxlength: 500,
    },
    // Admin who last updated the status
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    statusUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Pre-save: hash password if modified ───────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance: verify password ─────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ── Virtual: is this account allowed on the platform? ────────────────────────
UserSchema.virtual('isActive').get(function () {
  return this.status === 'Approved';
});

module.exports = mongoose.model('User', UserSchema);