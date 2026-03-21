const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
    required: false // allowing false so we don't break existing records
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Use singular model name to match refs like ref: 'Student'
module.exports = mongoose.model('Student', studentSchema);