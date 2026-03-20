const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
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
    default: 3
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


// Method to check if volunteer can accept more sessions today
volunteerSchema.methods.canAcceptMoreSessions = function() {
  const now = new Date();
  const lastReset = this.lastSessionReset ? new Date(this.lastSessionReset) : new Date(0);

  // Reset daily count if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    this.todaysSessions = 0;
    this.lastSessionReset = now;
  }

  const todaysSessions = typeof this.todaysSessions === 'number' ? this.todaysSessions : 0;
  const limit = typeof this.dailySessionLimit === 'number' ? this.dailySessionLimit : 0;

  return todaysSessions < limit;
};

// Use singular model name to match refs like ref: 'Volunteer'
// Avoid OverwriteModelError in dev/hot-reload by reusing existing model when present
module.exports = mongoose.models.Volunteer || mongoose.model('Volunteer', volunteerSchema);