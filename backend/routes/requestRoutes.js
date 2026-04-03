const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { uploadReviewAttachment } = require('../middleware/upload');
const {
  createRequest,
  getRequestById,
  updateRequest,
  acceptRequest,
  rejectRequest,
  completeRequest,
  addReview,
  deleteRequest
} = require('../controllers/requestController');

// Shared validation helpers
const validateRequestId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request id',
      errors: [{ path: 'id', message: 'Must be a valid Mongo ObjectId.' }],
    });
  }
  next();
};

const validateCreateRequest = (req, res, next) => {
  const { studentId, volunteerId, subject, date, timeSlot, message } = req.body;
  const errors = [];

  if (!volunteerId || !mongoose.Types.ObjectId.isValid(volunteerId)) {
    errors.push({ path: 'volunteerId', message: 'volunteerId is required and must be a valid ObjectId.' });
  }

  if (studentId && !mongoose.Types.ObjectId.isValid(studentId)) {
    errors.push({ path: 'studentId', message: 'studentId must be a valid ObjectId when provided.' });
  }

  if (!subject || typeof subject !== 'string') {
    errors.push({ path: 'subject', message: 'subject is required.' });
  }

  if (!date || typeof date !== 'string') {
    errors.push({ path: 'date', message: 'date is required and must be a string.' });
  }

  if (!timeSlot || typeof timeSlot !== 'string') {
    errors.push({ path: 'timeSlot', message: 'timeSlot is required.' });
  }

  if (message && typeof message === 'string') {
    const trimmed = message.trim();
    if (trimmed.length > 500) {
      errors.push({ path: 'message', message: 'message must be at most 500 characters.' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Create new support request
router.post('/', validateCreateRequest, createRequest);

// Get request by ID
router.get('/:id', validateRequestId, getRequestById);

// Update an existing support request (student action)
router.put('/:id', validateRequestId, updateRequest);

// Accept request (volunteer action)
router.put('/:id/accept', validateRequestId, acceptRequest);

// Reject request (volunteer action)
router.put('/:id/reject', validateRequestId, rejectRequest);

// Complete request
router.put('/:id/complete', validateRequestId, completeRequest);

// Add a review/rating for a request (student action, with optional file upload)
router.post('/:id/review', validateRequestId, uploadReviewAttachment.single('attachment'), addReview);

// Delete a support request (student action)
router.delete('/:id', validateRequestId, deleteRequest);

module.exports = router;