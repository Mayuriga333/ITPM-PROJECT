/**
 * controllers/adminController.js — Admin moderation & platform management
 *
 * All endpoints require role === 'Admin'.
 *
 * Responsibilities:
 *   - Platform statistics (user counts by role/status)
 *   - User listing with filters (role, status, search)
 *   - Account status control: Approve / Reject / Suspend / Reactivate
 *   - Volunteer profile moderation: Approve / Reject profiles
 *   - Flag management: review flagged profiles, clear flags
 *   - Hard delete (superadmin-level cleanup)
 */

const User             = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const ChatSession      = require('../models/ChatSession');

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Returns platform-wide counts for the admin overview cards.
 */
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalVolunteers,
      pendingAccounts,
      approvedAccounts,
      rejectedAccounts,
      suspendedAccounts,
      pendingProfiles,
      approvedProfiles,
      rejectedProfiles,
      flaggedProfiles,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'Admin' } }),
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Volunteer' }),
      User.countDocuments({ status: 'Pending' }),
      User.countDocuments({ status: 'Approved' }),
      User.countDocuments({ status: 'Rejected' }),
      User.countDocuments({ status: 'Suspended' }),
      VolunteerProfile.countDocuments({ approvalStatus: 'Pending' }),
      VolunteerProfile.countDocuments({ approvalStatus: 'Approved' }),
      VolunteerProfile.countDocuments({ approvalStatus: 'Rejected' }),
      VolunteerProfile.countDocuments({ isFlagged: true }),
    ]);

    res.json({
      success: true,
      stats: {
        users:    { total: totalUsers, students: totalStudents, volunteers: totalVolunteers },
        accounts: { pending: pendingAccounts, approved: approvedAccounts, rejected: rejectedAccounts, suspended: suspendedAccounts },
        profiles: { pending: pendingProfiles, approved: approvedProfiles, rejected: rejectedProfiles, flagged: flaggedProfiles },
      },
    });
  } catch (err) {
    console.error('[Admin/getStats]', err);
    res.status(500).json({ success: false, message: 'Could not fetch statistics.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Query params: role, status, search, page, limit
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const filter = { role: { $ne: 'Admin' } }; // Hide other admins from list
    if (role   && role   !== 'all') filter.role   = role;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .populate('statusUpdatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('[Admin/getAllUsers]', err);
    res.status(500).json({ success: false, message: 'Could not fetch users.' });
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Body: { status: 'Approved'|'Rejected'|'Suspended'|'Pending', reason? }
 *
 * When a Volunteer is Approved here, their VolunteerProfile approvalStatus
 * is also set to 'Approved' if it was Pending.
 * When a Volunteer is Rejected/Suspended, their profile is also hidden.
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id }              = req.params;
    const { status, reason }  = req.body;

    const ALLOWED = ['Approved', 'Rejected', 'Suspended', 'Pending'];
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ALLOWED.join(', ')}` });
    }

    // Prevent admins from modifying their own status
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own account status.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be moderated here.' });
    }

    user.status          = status;
    user.statusReason    = reason || '';
    user.statusUpdatedBy = req.user._id;
    user.statusUpdatedAt = new Date();
    await user.save();

    // ── Mirror status onto VolunteerProfile ───────────────────────────────────
    if (user.role === 'Volunteer') {
      const profile = await VolunteerProfile.findOne({ userId: id });
      if (profile) {
        if (status === 'Approved' && profile.approvalStatus === 'Pending') {
          profile.approvalStatus  = 'Approved';
          profile.moderatedBy     = req.user._id;
          profile.moderatedAt     = new Date();
          profile.moderationNotes = 'Auto-approved when account was approved.';
        } else if (status === 'Rejected' || status === 'Suspended') {
          profile.approvalStatus  = 'Rejected';
          profile.moderatedBy     = req.user._id;
          profile.moderatedAt     = new Date();
          profile.moderationNotes = reason || `Profile hidden due to account ${status.toLowerCase()}.`;
        }
        await profile.save();
      }
    }

    res.json({
      success: true,
      message: `User status updated to '${status}'.`,
      user: {
        _id:           user._id,
        name:          user.name,
        email:         user.email,
        role:          user.role,
        status:        user.status,
        statusReason:  user.statusReason,
        statusUpdatedAt: user.statusUpdatedAt,
      },
    });
  } catch (err) {
    console.error('[Admin/updateUserStatus]', err);
    res.status(500).json({ success: false, message: 'Could not update user status.' });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently removes a user and all their data.
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted here.' });
    }

    // Cascade-delete related documents
    await Promise.all([
      VolunteerProfile.deleteOne({ userId: id }),
      ChatSession.deleteOne({ userId: id }),
      User.findByIdAndDelete(id),
    ]);

    res.json({ success: true, message: `User "${user.name}" and all associated data deleted.` });
  } catch (err) {
    console.error('[Admin/deleteUser]', err);
    res.status(500).json({ success: false, message: 'Could not delete user.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. VOLUNTEER PROFILE MODERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/profiles
 * Returns all volunteer profiles with user info.
 * Query params: approvalStatus ('Pending'|'Approved'|'Rejected'), isFlagged
 */
const getAllProfiles = async (req, res) => {
  try {
    const { approvalStatus, isFlagged, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (approvalStatus && approvalStatus !== 'all') filter.approvalStatus = approvalStatus;
    if (isFlagged === 'true') filter.isFlagged = true;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await VolunteerProfile.countDocuments(filter);

    const profiles = await VolunteerProfile.find(filter)
      .populate('userId',      'name email status createdAt')
      .populate('moderatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      profiles,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('[Admin/getAllProfiles]', err);
    res.status(500).json({ success: false, message: 'Could not fetch profiles.' });
  }
};

/**
 * PATCH /api/admin/profiles/:id/moderate
 * Body: { approvalStatus: 'Approved'|'Rejected'|'Pending', notes? }
 */
const moderateProfile = async (req, res) => {
  try {
    const { id }                      = req.params;
    const { approvalStatus, notes }   = req.body;

    const ALLOWED = ['Approved', 'Rejected', 'Pending'];
    if (!ALLOWED.includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ALLOWED.join(', ')}` });
    }

    const profile = await VolunteerProfile.findById(id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    profile.approvalStatus  = approvalStatus;
    profile.moderationNotes = notes || '';
    profile.moderatedBy     = req.user._id;
    profile.moderatedAt     = new Date();
    await profile.save();

    res.json({
      success: true,
      message: `Profile ${approvalStatus.toLowerCase()}.`,
      profile,
    });
  } catch (err) {
    console.error('[Admin/moderateProfile]', err);
    res.status(500).json({ success: false, message: 'Could not moderate profile.' });
  }
};

/**
 * PATCH /api/admin/profiles/:id/flag
 * Body: { isFlagged: boolean, flagReason? }
 * Toggles the flagged state and optionally resets flag count.
 */
const flagProfile = async (req, res) => {
  try {
    const { id }                     = req.params;
    const { isFlagged, flagReason }  = req.body;

    const profile = await VolunteerProfile.findByIdAndUpdate(
      id,
      {
        isFlagged:  !!isFlagged,
        flagReason: flagReason || '',
        ...(isFlagged ? { $inc: { flagCount: 1 } } : { flagCount: 0 }),
      },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

    res.json({ success: true, message: `Profile ${isFlagged ? 'flagged' : 'unflagged'}.`, profile });
  } catch (err) {
    console.error('[Admin/flagProfile]', err);
    res.status(500).json({ success: false, message: 'Could not update flag.' });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllProfiles,
  moderateProfile,
  flagProfile,
};