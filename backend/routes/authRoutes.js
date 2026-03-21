const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// @route   POST /api/auth/login
// @desc    Mock login to get session state (no JWT)
// @access  Public
router.post('/login', login);

module.exports = router;
