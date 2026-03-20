const express = require('express');
const router = express.Router();
const {
  registerStudent,
  getStudent,
  getStudentRequests,
  getStudentStats
} = require('../controllers/studentController');

// Student registration
router.post('/register', registerStudent);

// Get student by ID or email
router.get('/:id', getStudent);
router.get('/email/:email', getStudent);

// Get student's support requests
router.get('/:id/requests', getStudentRequests);

// Get student dashboard stats
router.get('/:id/stats', getStudentStats);

module.exports = router;