const mongoose = require('mongoose');
const SupportRequest = require('../models/SupportRequest');
const StudyVolunteer = require('../models/StudyVolunteer');
const StudyStudent = require('../models/StudyStudent');

const { detectInappropriateContent } = require('../middleware/reviewModeration');

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
    console.log('[createRequest] body:', JSON.stringify({ studentName, volunteerId, subject, date, timeSlot }));

    let student = null;

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      // Optional: if studentId is provided, look it up in StudyStudent.
      // If not found (e.g. P1 User id was sent), silently fall through to studentName.
      student = await StudyStudent.findById(studentId).catch(() => null);
    }

    const volunteer = await StudyVolunteer.findById(volunteerId);
    if (!volunteer) {
      return validationErrorResponse(res, 404, 'Volunteer not found');
    }

    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return validationErrorResponse(res, 400, 'Invalid subject', [
        { path: 'subject', message: 'Subject must be one of the allowed subjects.' },
      ]);
    }

    if (!volunteer.subjects.includes(subject)) {
      return validationErrorResponse(res, 400, 'Volunteer does not teach this subject', [
        { path: 'subject', message: 'Selected volunteer does not teach this subject.' },
      ]);
    }

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

    if (!ALLOWED_TIME_SLOTS.includes(timeSlot)) {
      return validationErrorResponse(res, 400, 'Invalid time slot', [
        { path: 'timeSlot', message: 'Time slot must be one of the allowed values.' },
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

    const resolvedStudentName = student ? student.name : studentName;
    if (!resolvedStudentName) {
      return validationErrorResponse(res, 400, 'Student name is required', [
        { path: 'studentName', message: 'Please provide your name.' },
      ]);
    }

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

    const volunteer = request.volunteer ? request.volunteer : await StudyVolunteer.findById(request.volunteer);
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

    const duplicateCheck = await SupportRequest.findOne({
      _id: { $ne: request._id },
      volunteer: request.volunteer._id || request.volunteer,
      student: request.student || undefined,
      studentName: request.student ? undefined : (studentName || request.studentName),
      date: requestDay,
      timeSlot,
      status: { $in: ['pending', 'accepted'] },
    });

    if (duplicateCheck) {
      return validationErrorResponse(res, 409, 'Duplicate request for this time slot', [
        { path: 'timeSlot', message: 'You already have a request for this volunteer at this time.' },
      ]);
    }

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
    
    const volunteer = await StudyVolunteer.findById(request.volunteer);
    if (!volunteer) {
      return validationErrorResponse(res, 404, 'Volunteer not found');
    }

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
    
    if (!volunteer.canAcceptMoreSessions()) {
      return validationErrorResponse(res, 400, 'Daily session limit reached');
    }
    
    request.status = 'accepted';
    await request.save();
    
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

// Add a student review + rating for a completed/accepted request (ITPM-style full review)
exports.addReview = async (req, res) => {
  try {
    const TOPIC_REGEX = /^[a-zA-Z0-9\s.,!?\-_'"():;/&]+$/;
    const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,!?\-_'"():;/&\n\r]*$/;
    const VALID_TAGS = ['positive', 'neutral', 'needs_improvement'];
    const VALID_EXPERIENCE_TYPES = ['practice', 'review', 'new_learning'];

    const {
      rating,
      reviewText,
      topicStudied,
      followUpMatchAgain,
      feedbackTags,
      sessionDate,
      experienceType,
      recommendation,
      isAnonymous,
    } = req.body;

    // ── Validate rating ──
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return validationErrorResponse(res, 400, 'Rating must be between 1 and 5', [
        { path: 'rating', message: 'Rating must be a number between 1 and 5.' },
      ]);
    }

    // ── Validate topic / subject studied ──
    const normalizedTopic = (topicStudied || '').trim();
    if (!normalizedTopic) {
      return validationErrorResponse(res, 400, 'Topic/Subject studied is required', [
        { path: 'topicStudied', message: 'Topic/Subject studied is required.' },
      ]);
    }
    if (normalizedTopic.length < 3 || normalizedTopic.length > 200) {
      return validationErrorResponse(res, 400, 'Topic must be 3-200 characters', [
        { path: 'topicStudied', message: 'Topic/Subject studied must be 3-200 characters.' },
      ]);
    }
    if (!TOPIC_REGEX.test(normalizedTopic)) {
      return validationErrorResponse(res, 400, 'Topic contains invalid characters', [
        { path: 'topicStudied', message: 'Topic/Subject studied contains invalid characters.' },
      ]);
    }

    // ── Validate follow-up ──
    let normalizedFollowUp = null;
    if (typeof followUpMatchAgain === 'boolean') {
      normalizedFollowUp = followUpMatchAgain;
    } else if (typeof followUpMatchAgain === 'string') {
      const lower = followUpMatchAgain.trim().toLowerCase();
      if (['true', 'yes', '1'].includes(lower)) normalizedFollowUp = true;
      else if (['false', 'no', '0'].includes(lower)) normalizedFollowUp = false;
    }
    if (normalizedFollowUp === null) {
      return validationErrorResponse(res, 400, 'Follow-up action is required', [
        { path: 'followUpMatchAgain', message: 'Please select Yes or No.' },
      ]);
    }

    // ── Validate feedback tags ──
    let normalizedTags = [];
    if (typeof feedbackTags === 'string') {
      try { normalizedTags = JSON.parse(feedbackTags); } catch { normalizedTags = feedbackTags.split(',').map(t => t.trim()).filter(Boolean); }
    } else if (Array.isArray(feedbackTags)) {
      normalizedTags = feedbackTags;
    }
    if (!normalizedTags.length) {
      return validationErrorResponse(res, 400, 'At least one feedback tag is required', [
        { path: 'feedbackTags', message: 'Please select at least one feedback tag.' },
      ]);
    }
    if (normalizedTags.length > 3) {
      return validationErrorResponse(res, 400, 'Maximum 3 feedback tags', [
        { path: 'feedbackTags', message: 'You can select a maximum of 3 feedback tags.' },
      ]);
    }
    if (normalizedTags.some(tag => !VALID_TAGS.includes(tag))) {
      return validationErrorResponse(res, 400, 'Invalid feedback tag', [
        { path: 'feedbackTags', message: 'Allowed: positive, neutral, needs_improvement.' },
      ]);
    }

    // ── Validate session date ──
    if (!sessionDate) {
      return validationErrorResponse(res, 400, 'Session date is required', [
        { path: 'sessionDate', message: 'Session date is required.' },
      ]);
    }
    const parsedSessionDate = new Date(sessionDate);
    if (Number.isNaN(parsedSessionDate.getTime())) {
      return validationErrorResponse(res, 400, 'Invalid session date', [
        { path: 'sessionDate', message: 'Session date format is invalid.' },
      ]);
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedSessionDate > today) {
      return validationErrorResponse(res, 400, 'Session date cannot be in the future', [
        { path: 'sessionDate', message: 'Session date cannot be in the future.' },
      ]);
    }
    const oldestAllowed = new Date();
    oldestAllowed.setFullYear(oldestAllowed.getFullYear() - 1);
    oldestAllowed.setHours(0, 0, 0, 0);
    if (parsedSessionDate < oldestAllowed) {
      return validationErrorResponse(res, 400, 'Session date too old', [
        { path: 'sessionDate', message: 'Session date cannot be older than 1 year.' },
      ]);
    }

    // ── Validate experience type ──
    if (!experienceType || !VALID_EXPERIENCE_TYPES.includes(experienceType)) {
      return validationErrorResponse(res, 400, 'Invalid experience type', [
        { path: 'experienceType', message: 'Allowed: practice, review, new_learning.' },
      ]);
    }

    // ── Validate recommendation ──
    const normalizedRecommendation = (recommendation || '').trim();
    if (normalizedRecommendation.length > 500) {
      return validationErrorResponse(res, 400, 'Recommendation too long', [
        { path: 'recommendation', message: 'Recommendation cannot exceed 500 characters.' },
      ]);
    }
    if (normalizedRecommendation && !SAFE_TEXT_REGEX.test(normalizedRecommendation)) {
      return validationErrorResponse(res, 400, 'Recommendation contains unsafe characters', [
        { path: 'recommendation', message: 'Recommendation contains unsafe characters.' },
      ]);
    }

    // ── Validate review text safety ──
    const normalizedReviewText = (reviewText || '').trim();
    if (normalizedReviewText && !SAFE_TEXT_REGEX.test(normalizedReviewText)) {
      return validationErrorResponse(res, 400, 'Review text contains unsafe characters', [
        { path: 'reviewText', message: 'Review text contains unsafe characters.' },
      ]);
    }

    // ── Find request ──
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

    // ── Content moderation ──
    let reviewStatus = 'approved';
    let flagReason = '';
    let moderationScore = 0;
    let moderationSeverity = null;

    if (normalizedReviewText) {
      const modResult = detectInappropriateContent(normalizedReviewText, numRating);
      moderationScore = modResult.score;
      moderationSeverity = modResult.severity;

      if (modResult.autoReject) {
        reviewStatus = 'rejected';
        flagReason = modResult.reasons.join('; ');
      } else if (modResult.flagged) {
        reviewStatus = 'flagged';
        flagReason = modResult.reasons.join('; ');
      }
    }

    // ── Handle attachment ──
    const attachment = req.file
      ? {
          fileName: req.file.originalname,
          fileUrl: `/uploads/reviews/${req.file.filename}`,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : { fileName: '', fileUrl: '', mimeType: '', size: 0 };

    // ── Save review on request ──
    request.rating = numRating;
    request.reviewText = normalizedReviewText;
    request.reviewSubject = normalizedTopic;
    request.followUpMatchAgain = normalizedFollowUp;
    request.feedbackTags = normalizedTags;
    request.reviewSessionDate = parsedSessionDate;
    request.experienceType = experienceType;
    request.attachment = attachment;
    request.recommendation = normalizedRecommendation;
    request.isAnonymous = isAnonymous || false;
    request.moderationStatus = reviewStatus;
    request.flagReason = flagReason;
    request.moderationScore = moderationScore;
    request.moderationSeverity = moderationSeverity;
    request.reviewCreatedAt = new Date();

    await request.save();

    // ── Update volunteer stats ──
    if (reviewStatus === 'approved') {
      const volunteer = await StudyVolunteer.findById(request.volunteer);
      if (volunteer) {
        const currentCount = typeof volunteer.ratingCount === 'number' ? volunteer.ratingCount : 0;
        const currentRating = typeof volunteer.rating === 'number' ? volunteer.rating : 0;
        const newCount = currentCount + 1;
        volunteer.ratingCount = newCount;
        volunteer.rating = ((currentRating * currentCount) + numRating) / newCount;
        await volunteer.save();
      }
    }

    // ── Build moderation feedback ──
    let moderationMessage = null;
    if (reviewStatus === 'flagged') {
      moderationMessage = 'Your review has been submitted for moderation. It will be visible after admin approval.';
    } else if (reviewStatus === 'rejected') {
      moderationMessage = 'Your review was automatically rejected due to policy violations. Please revise and resubmit.';
    }

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: request,
      moderationStatus: reviewStatus,
      moderationMessage,
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
