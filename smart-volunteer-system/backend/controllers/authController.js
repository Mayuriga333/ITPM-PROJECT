/**
 * controllers/authController.js — Registration, login, profile
 *
 * Status auto-assignment on registration:
 *   Student   → Approved  (immediate access)
 *   Volunteer → Pending   (requires admin approval)
 *   Admin     → Approved  (seeded directly; cannot self-register)
 */

const jwt              = require('jsonwebtoken');
const User             = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');

// ── Helper: signed JWT ────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Helper: safe user payload for client ─────────────────────────────────────
const sanitizeUser = (user) => ({
  _id:           user._id,
  name:          user.name,
  email:         user.email,
  role:          user.role,
  status:        user.status,
  statusReason:  user.statusReason,
});

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }   (role: 'Student' | 'Volunteer')
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Prevent public creation of Admin accounts
    if (role === 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    // Determine initial status based on role
    const initialStatus = role === 'Student' ? 'Approved' : 'Pending';

    const user = await User.create({ name, email, password, role, status: initialStatus });

    // Create an empty VolunteerProfile for volunteers
    if (role === 'Volunteer') {
      await VolunteerProfile.create({ userId: user._id });
    }

    const token = generateToken(user._id);

    const message = role === 'Volunteer'
      ? 'Registration successful. Your account is pending admin approval.'
      : 'Registration successful.';

    res.status(201).json({
      success: true,
      message,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('[Auth/register]', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Status check is enforced by the protect middleware for protected routes,
 * but also block here so the client receives a clear error on login.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // ── Enforce status at login ───────────────────────────────────────────────
    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: `Your account has been suspended${user.statusReason ? ': ' + user.statusReason : '.'}`,
      });
    }
    if (user.status === 'Rejected') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_REJECTED',
        message: `Your account application was rejected${user.statusReason ? ': ' + user.statusReason : '.'}`,
      });
    }
    if (user.status === 'Pending') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_PENDING',
        message: 'Your account is pending admin approval. Please check back later.',
      });
    }

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful.', token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[Auth/login]', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * GET /api/auth/me  (protected)
 */
const getMe = async (req, res) => {
  try {
    res.json({ success: true, user: sanitizeUser(req.user) });
  } catch (err) {
    console.error('[Auth/getMe]', err);
    res.status(500).json({ success: false, message: 'Could not fetch profile.' });
  }
};

/**
 * PUT /api/auth/profile  (protected)
 * Body: { name, email, password }
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email is already registered.' });
      }
      updateData.email = email;
    }
    if (password) updateData.password = password;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('[Auth/updateProfile]', err);
    res.status(500).json({ success: false, message: 'Server error during profile update.' });
  }
};

/**
 * DELETE /api/auth/profile  (protected)
 */
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Profile deleted successfully.',
    });
  } catch (err) {
    console.error('[Auth/deleteProfile]', err);
    res.status(500).json({ success: false, message: 'Server error during profile deletion.' });
  }
};

module.exports = { register, login, getMe, updateProfile, deleteProfile };