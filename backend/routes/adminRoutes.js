/**
 * routes/adminRoutes.js — All admin endpoints (role: Admin only)
 */
const express = require('express');
const router  = express.Router();

const {
  getStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllProfiles,
  moderateProfile,
  flagProfile,
} = require('../controllers/adminController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect, authorizeRoles('Admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

router.get('/profiles', getAllProfiles);
router.patch('/profiles/:id/moderate', moderateProfile);
router.patch('/profiles/:id/flag', flagProfile);

module.exports = router;