/**
 * models/ChatSession.js — Stores chatbot conversation state per user
 *
 * Steps (in order):
 *   0 → IDLE      : Waiting for the student to start
 *   1 → SUBJECT   : Asking which subject they need help with
 *   2 → TOPIC     : Asking for a specific topic within that subject
 *   3 → TIME      : Asking for preferred time / availability
 *   4 → COMPLETE  : All data collected; ready for matching
 */

const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One active session per user
    },
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    collectedData: {
      subject:       { type: String, default: '' },
      topic:         { type: String, default: '' },
      preferredTime: { type: String, default: '' },
    },
    messages: [
      {
        sender:    { type: String, enum: ['bot', 'user'], required: true },
        text:      { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', ChatSessionSchema);