const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyStudent',
    required: false
  },
  studentName: {
    type: String,
    required: true
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyVolunteer',
    required: true
  },
  volunteerName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    enum: [
      'Java',
      'Python',
      'C++',
      'C#',
      'DSA',
      'CS',
      'OOP',
      'MERN',
      'Springboot',
      '.NET',
      'Statistics',
      'Networking',
      'Project Management',
    ],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  message: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  rejectReason: {
    type: String,
    maxlength: 500
  },
  // ── Review fields (mirrors ITPM Review model) ──
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    maxlength: 1000
  },
  reviewSubject: {
    type: String,
    maxlength: 200
  },
  followUpMatchAgain: {
    type: Boolean
  },
  feedbackTags: {
    type: [String],
    enum: ['positive', 'neutral', 'needs_improvement'],
    default: []
  },
  reviewSessionDate: {
    type: Date
  },
  experienceType: {
    type: String,
    enum: ['practice', 'review', 'new_learning']
  },
  attachment: {
    fileName: { type: String, default: '' },
    fileUrl:  { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size:     { type: Number, default: 0 }
  },
  recommendation: {
    type: String,
    maxlength: 500
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'rejected'],
    default: 'pending'
  },
  flagReason: {
    type: String
  },
  moderationScore: {
    type: Number,
    default: 0
  },
  moderationSeverity: {
    type: String
  },
  adminNote: {
    type: String
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  reviewCreatedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
