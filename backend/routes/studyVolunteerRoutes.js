const express = require('express');
const router = express.Router();
const {
  registerVolunteer,
  getVolunteers,
  getVolunteerById,
  getVolunteerRequests,
  getVolunteerStats
} = require('../controllers/studyVolunteerController');

// Study volunteer registration
router.post('/register', registerVolunteer);

// Get all study volunteers with filters
router.get('/', getVolunteers);

// Get study volunteer by ID
router.get('/:id', getVolunteerById);

// Get study volunteer's incoming requests
router.get('/:id/requests', getVolunteerRequests);

// Get study volunteer dashboard stats
router.get('/:id/stats', getVolunteerStats);

module.exports = router;
