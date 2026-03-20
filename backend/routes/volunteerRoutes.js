const express = require('express');
const router = express.Router();
const {
  registerVolunteer,
  getVolunteers,
  getVolunteerById,
  getVolunteerRequests,
  getVolunteerStats
} = require('../controllers/volunteerController');

// Volunteer registration
router.post('/register', registerVolunteer);

// Get all volunteers with filters
router.get('/', getVolunteers);

// Get volunteer by ID
router.get('/:id', getVolunteerById);

// Get volunteer's incoming requests
router.get('/:id/requests', getVolunteerRequests);

// Get volunteer dashboard stats
router.get('/:id/stats', getVolunteerStats);

module.exports = router;