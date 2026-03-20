const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false
  },
  studentName: {
    type: String,
    required: true
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Requests', supportRequestSchema);