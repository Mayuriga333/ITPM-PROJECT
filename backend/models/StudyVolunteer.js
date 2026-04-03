const mongoose = require('mongoose');

const studyVolunteerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  subjects: [{
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
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  availability: {
    type: String,
    enum: ['Available Now', 'This Week', 'Any Time'],
    default: 'Any Time'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  dailySessionLimit: {
    type: Number,
    default: 6
  },
  todaysSessions: {
    type: Number,
    default: 0
  },
  lastSessionReset: {
    type: Date,
    default: Date.now
  }
});

studyVolunteerSchema.methods.canAcceptMoreSessions = function() {
  const now = new Date();
  const lastReset = this.lastSessionReset ? new Date(this.lastSessionReset) : new Date(0);

  if (now.toDateString() !== lastReset.toDateString()) {
    this.todaysSessions = 0;
    this.lastSessionReset = now;
  }

  const todaysSessions = typeof this.todaysSessions === 'number' ? this.todaysSessions : 0;
  const limit = typeof this.dailySessionLimit === 'number' ? this.dailySessionLimit : 0;

  return todaysSessions < limit;
};

module.exports = mongoose.models.StudyVolunteer || mongoose.model('StudyVolunteer', studyVolunteerSchema);
