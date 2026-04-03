/**
 * middleware/authMiddleware.js — JWT verification, status enforcement, RBAC
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Verifies the JWT and enforces account status.
 *   - Suspended  → 403 (account suspended)
 *   - Rejected   → 403 (account rejected)
 *   - Pending    → 403 (account pending admin approval)
 *   Only 'Approved' accounts can proceed past this middleware.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided. Access denied.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // ── Enforce account status ────────────────────────────────────────────────
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
        message: 'Your account is awaiting admin approval. You will be notified once reviewed.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token.';
    return res.status(401).json({ success: false, message });
  }
};

/**
 * authorizeRoles — Restricts access to one or more roles.
 * Usage: authorizeRoles('Admin') or authorizeRoles('Student', 'Admin')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is restricted to: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

/**
 * requireApproved — Extra guard ensuring status is 'Approved'.
 * Use after protect() when you want to be explicit.
 */
const requireApproved = (req, res, next) => {
  if (req.user.status !== 'Approved') {
    return res.status(403).json({
      success: false,
      message: 'Your account must be approved to access this resource.',
    });
  }
  next();
};

module.exports = { protect, authorizeRoles, requireApproved };