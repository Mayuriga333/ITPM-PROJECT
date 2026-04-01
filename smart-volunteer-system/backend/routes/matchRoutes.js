/**
 * routes/matchRoutes.js
 */

const express = require('express');
const router  = express.Router();

const { getMatches, upsertProfile, getMyProfile } = require('../controllers/matchController');
const { protect, authorizeRoles }                 = require('../middleware/authMiddleware');

// Student: get top volunteer matches
router.get('/volunteers', protect, authorizeRoles('Student'), getMatches);

// Volunteer: manage their own profile
router.get('/profile',  protect, authorizeRoles('Volunteer'), getMyProfile);
router.post('/profile', protect, authorizeRoles('Volunteer'), upsertProfile);

module.exports = router;