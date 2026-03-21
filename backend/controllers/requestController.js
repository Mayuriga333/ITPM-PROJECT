const mongoose = require('mongoose');
const SupportRequest = require('../models/SupportRequest');
const Volunteer = require('../models/Volunteer');
const Student = require('../models/Student');

const ALLOWED_SUBJECTS = SupportRequest.schema.path('subject').enumValues;
const ALLOWED_TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
];

const validationErrorResponse = (res, status, message, errors = []) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
  });
};

const buildRequestDay = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

// Create a new support request
exports.createRequest = async (req, res) => {
  try {
    const { studentId, studentName, volunteerId, subject, date, timeSlot, message } = req.body;

    let student = null;

    // If a studentId is provided, validate it and prefer the stored name
    if (studentId) {
      student = await Student.findById(studentId);
      if (!student) {
        return validationErrorResponse(res, 404, 'Student not found');
      }
    }

    // Check if volunteer exists
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return validationErrorResponse(res, 404, 'Volunteer not found');
    }

    // Basic subject guard against enum drift
    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return validationErrorResponse(res, 400, 'Invalid subject', [
        { path: 'subject', message: 'Subject must be one of the allowed subjects.' },
      ]);
    }

    // Check if volunteer is available for this subject
    if (!volunteer.subjects.includes(subject)) {
      return validationErrorResponse(res, 400, 'Volunteer does not teach this subject', [
        { path: 'subject', message: 'Selected volunteer does not teach this subject.' },
      ]);
    }

    // Validate requested date (today or future)
    const requestedDate = new Date(date);
    if (Number.isNaN(requestedDate.getTime())) {
      return validationErrorResponse(res, 400, 'Invalid date', [
        { path: 'date', message: 'Date must be a valid ISO date string.' },
      ]);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDay = new Date(requestedDate);
    requestDay.setHours(0, 0, 0, 0);

    if (requestDay < today) {
      return validationErrorResponse(res, 400, 'Date must be today or in the future', [
        { path: 'date', message: 'You cannot book sessions in the past.' },
      ]);
    }

    // Validate time slot is from allowed list
    if (!ALLOWED_TIME_SLOTS.includes(timeSlot)) {
      return validationErrorResponse(res, 400, 'Invalid time slot', [
        { path: 'timeSlot', message: 'Time slot must be one of the allowed values.' },
      ]);
    }

    // Volunteer availability window
    if (volunteer.availability === 'Available Now' && requestDay > today) {
      return validationErrorResponse(res, 400, 'Volunteer is only available today', [
        { path: 'date', message: 'This volunteer is marked as "Available Now" only.' },
      ]);
    }

    if (volunteer.availability === 'This Week') {
      const weekAhead = new Date(today);
      weekAhead.setDate(weekAhead.getDate() + 7);
      if (requestDay > weekAhead) {
        return validationErrorResponse(res, 400, 'Volunteer is only available this week', [
          { path: 'date', message: 'Choose a date within the next 7 days.' },
        ]);
      }
    }

    // Determine the name to store on the request
    const resolvedStudentName = student ? student.name : studentName;
    if (!resolvedStudentName) {
      return validationErrorResponse(res, 400, 'Student name is required', [
        { path: 'studentName', message: 'Please provide your name.' },
      ]);
    }

    // Prevent duplicate pending/accepted requests for same slot
    const duplicate = await SupportRequest.findOne({
      volunteer: volunteerId,
      student: student ? student._id : undefined,
      studentName: student ? undefined : resolvedStudentName,
      date: requestDay,
      timeSlot,
      status: { $in: ['pending', 'accepted'] },
    });

    if (duplicate) {
      return validationErrorResponse(res, 409, 'Duplicate request for this time slot', [
        { path: 'timeSlot', message: 'You already have a request for this volunteer at this time.' },
      ]);
    }

    // Prevent collisions with already accepted sessions for this volunteer
    const conflictingAccepted = await SupportRequest.findOne({
      volunteer: volunteerId,
      date: requestDay,
      timeSlot,
      status: 'accepted',
    });

    if (conflictingAccepted) {
      return validationErrorResponse(res, 409, 'Time slot already booked', [
        { path: 'timeSlot', message: 'This volunteer already has an accepted session at this time.' },
      ]);
    }

    // Create support request
    const request = new SupportRequest({
      student: student ? student._id : undefined,
      studentName: resolvedStudentName,
      volunteer: volunteerId,
      volunteerName: volunteer.name,
      subject,
      date: requestDay,
      timeSlot,
      message,
      status: 'pending'
    });
    
    await request.save();
    
    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};

// Update an existing support request (student action, only while pending)
exports.updateRequest = async (req, res) => {
  try {
    const { subject, date, timeSlot, message, studentName } = req.body;

    const request = await SupportRequest.findById(req.params.id).populate('volunteer');
    if (!request) {
      return validationErrorResponse(res, 404, 'Request not found');
    }

    if (request.status !== 'pending') {
      return validationErrorResponse(res, 400, 'Only pending requests can be updated');
    }

    const volunteer = request.volunteer ? request.volunteer : await Volunteer.findById(request.volunteer);
    if (!volunteer) {
      return validationErrorResponse(res, 404, 'Volunteer not found');
    }

    const errors = [];

    if (!subject || typeof subject !== 'string') {
      errors.push({ path: 'subject', message: 'subject is required.' });
    } else if (!ALLOWED_SUBJECTS.includes(subject)) {
      errors.push({ path: 'subject', message: 'Subject must be one of the allowed subjects.' });
    } else if (!volunteer.subjects.includes(subject)) {
      errors.push({ path: 'subject', message: 'Selected volunteer does not teach this subject.' });
    }

    if (!date || typeof date !== 'string') {
      errors.push({ path: 'date', message: 'date is required and must be a string.' });
    }

    if (!timeSlot || typeof timeSlot !== 'string') {
      errors.push({ path: 'timeSlot', message: 'timeSlot is required.' });
    } else if (!ALLOWED_TIME_SLOTS.includes(timeSlot)) {
      errors.push({ path: 'timeSlot', message: 'Time slot must be one of the allowed values.' });
    }

    if (message && typeof message === 'string') {
      const trimmed = message.trim();
      if (trimmed.length > 500) {
        errors.push({ path: 'message', message: 'message must be at most 500 characters.' });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, 400, 'Validation failed', errors);
    }

    const requestedDate = new Date(date);
    if (Number.isNaN(requestedDate.getTime())) {
      return validationErrorResponse(res, 400, 'Invalid date', [
        { path: 'date', message: 'Date must be a valid ISO date string.' },
      ]);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDay = buildRequestDay(requestedDate);

    if (!requestDay) {
      return validationErrorResponse(res, 400, 'Invalid date', [
        { path: 'date', message: 'Date must be a valid ISO date string.' },
      ]);
    }

    if (requestDay < today) {
      return validationErrorResponse(res, 400, 'Date must be today or in the future', [
        { path: 'date', message: 'You cannot book sessions in the past.' },
      ]);
    }

    if (volunteer.availability === 'Available Now' && requestDay > today) {
      return validationErrorResponse(res, 400, 'Volunteer is only available today', [
        { path: 'date', message: 'This volunteer is marked as "Available Now" only.' },
      ]);
    }

    if (volunteer.availability === 'This Week') {
      const weekAhead = new Date(today);
      weekAhead.setDate(weekAhead.getDate() + 7);
      if (requestDay > weekAhead) {
        return validationErrorResponse(res, 400, 'Volunteer is only available this week', [
          { path: 'date', message: 'Choose a date within the next 7 days.' },
        ]);
      }
    }

    // Prevent duplicate pending/accepted requests for same slot (for this student + volunteer)
    const duplicate = await SupportRequest.findOne({
      _id: { $ne: request._id },
      volunteer: request.volunteer,
      student: request.student || undefined,
      studentName: request.student ? undefined : (studentName || request.studentName),
      date: requestDay,
      timeSlot,
      status: { $in: ['pending', 'accepted'] },
    });

    if (duplicate) {
      return validationErrorResponse(res, 409, 'Duplicate request for this time slot', [
        { path: 'timeSlot', message: 'You already have a request for this volunteer at this time.' },
      ]);
    }

    // Apply updates
    if (studentName && typeof studentName === 'string') {
      request.studentName = studentName;
    }
    request.subject = subject;
    request.date = requestDay;
    request.timeSlot = timeSlot;
    if (typeof message === 'string') {
      request.message = message.trim();
    }

    await request.save();

    res.json({
      success: true,
      message: 'Request updated successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};

// Get request by ID
exports.getRequestById = async (req, res) => {
  try {
    const request = await SupportRequest.findById(req.params.id)
      .populate('student', 'name email')
      .populate('volunteer', 'name email subjects rating');
    
    if (!request) {
      return validationErrorResponse(res, 404, 'Request not found');
    }
    
    res.json({
      success: true,
      message: 'Request fetched successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};

// Accept a support request (volunteer action)
exports.acceptRequest = async (req, res) => {
  try {
    const request = await SupportRequest.findById(req.params.id);
    
    if (!request) {
      return validationErrorResponse(res, 404, 'Request not found');
    }
    
    if (request.status !== 'pending') {
      return validationErrorResponse(res, 400, 'Request is no longer pending');
    }
    
    const volunteer = await Volunteer.findById(request.volunteer);
    if (!volunteer) {
      return validationErrorResponse(res, 404, 'Volunteer not found');
    }

    // Re-check for schedule collision before accepting
    const requestDay = new Date(request.date);
    requestDay.setHours(0, 0, 0, 0);
    const slotConflict = await SupportRequest.findOne({
      _id: { $ne: request._id },
      volunteer: request.volunteer,
      date: requestDay,
      timeSlot: request.timeSlot,
      status: 'accepted',
    });

    if (slotConflict) {
      return validationErrorResponse(res, 409, 'Time slot already booked', [
        { path: 'timeSlot', message: 'This volunteer already has an accepted session at this time.' },
      ]);
    }
    
    // Check if volunteer can accept more sessions today
    if (!volunteer.canAcceptMoreSessions()) {
      return validationErrorResponse(res, 400, 'Daily session limit reached');
    }
    
    // Update request status
    request.status = 'accepted';
    await request.save();
    
    // Update volunteer stats
    volunteer.todaysSessions += 1;
    volunteer.totalSessions += 1;
    await volunteer.save();
    
    res.json({
      success: true,
      message: 'Request accepted successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};

// Reject a support request (volunteer action)
exports.rejectRequest = async (req, res) => {
  try {
    const request = await SupportRequest.findById(req.params.id);

    if (!request) {
      return validationErrorResponse(res, 404, 'Request not found');
    }

    if (request.status !== 'pending') {
      return validationErrorResponse(res, 400, 'Request is no longer pending');
    }

    const { rejectReason } = req.body;

    request.status = 'rejected';
    if (rejectReason) {
      request.rejectReason = rejectReason;
    }
    
    await request.save();

    res.json({
      success: true,
      message: 'Request rejected successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};

// Complete a support request
exports.completeRequest = async (req, res) => {
  try {
    const request = await SupportRequest.findById(req.params.id);
    
    if (!request) {
      return validationErrorResponse(res, 404, 'Request not found');
    }
    
    if (request.status !== 'accepted') {
      return validationErrorResponse(res, 400, 'Only accepted requests can be completed');
    }
    
    request.status = 'completed';
    await request.save();
    
    res.json({
      success: true,
      message: 'Request marked as completed',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};

// Add a student review + rating for a completed/accepted request
exports.addReview = async (req, res) => {
  try {
    const { rating, reviewText, reviewSubject } = req.body;

    const errors = [];

    if (typeof rating !== 'number' || Number.isNaN(rating) || rating < 1 || rating > 5) {
      errors.push({ path: 'rating', message: 'Rating must be a number between 1 and 5.' });
    }

    if (!reviewSubject || typeof reviewSubject !== 'string' || !reviewSubject.trim()) {
      errors.push({ path: 'reviewSubject', message: 'Topic/subject studied is required.' });
    }

    if (reviewText && typeof reviewText === 'string' && reviewText.trim().length > 1000) {
      errors.push({ path: 'reviewText', message: 'Review must be at most 1000 characters.' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, 400, 'Validation failed', errors);
    }

    const request = await SupportRequest.findById(req.params.id);

    if (!request) {
      return validationErrorResponse(res, 404, 'Request not found');
    }

    if (!['accepted', 'completed'].includes(request.status)) {
      return validationErrorResponse(res, 400, 'Only accepted or completed requests can be reviewed');
    }

    if (typeof request.rating === 'number' && request.rating > 0) {
      return validationErrorResponse(res, 400, 'This request already has a review');
    }

    request.rating = rating;
    request.reviewText = reviewText ? reviewText.trim() : '';
    request.reviewSubject = reviewSubject.trim();
    request.reviewCreatedAt = new Date();

    await request.save();

    // Update volunteer's aggregate rating if possible
    const volunteer = await Volunteer.findById(request.volunteer);
    if (volunteer) {
      const currentCount = typeof volunteer.ratingCount === 'number' ? volunteer.ratingCount : 0;
      const currentRating = typeof volunteer.rating === 'number' ? volunteer.rating : 0;
      const newCount = currentCount + 1;

      const newAverage = ((currentRating * currentCount) + rating) / (newCount || 1);

      volunteer.ratingCount = newCount;
      volunteer.rating = newAverage;
      await volunteer.save();
    }

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};

// Delete a support request (student action, allowed for pending or rejected)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await SupportRequest.findById(req.params.id);

    if (!request) {
      return validationErrorResponse(res, 404, 'Request not found');
    }

    if (!['pending', 'rejected'].includes(request.status)) {
      return validationErrorResponse(res, 400, 'Only pending or rejected requests can be deleted');
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Request deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ path: null, message: error.message }],
    });
  }
};


//Testing comment