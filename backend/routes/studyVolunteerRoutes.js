const express = require('express');
const router = express.Router();
const {
  registerVolunteer,
  getVolunteers,
  getVolunteerById,
  getVolunteerRequests,
  getVolunteerStats,
  getVolunteerPublicReviews,
} = require('../controllers/studyVolunteerController');

// Study volunteer registration
router.post('/register', registerVolunteer);

// Get all study volunteers with filters
router.get('/', getVolunteers);

// Public reviews for a volunteer profile
router.get('/:id/reviews', getVolunteerPublicReviews);

// Get study volunteer by ID
router.get('/:id', getVolunteerById);

// Get study volunteer's incoming requests
router.get('/:id/requests', getVolunteerRequests);

// Get study volunteer dashboard stats
router.get('/:id/stats', getVolunteerStats);

module.exports = router;
