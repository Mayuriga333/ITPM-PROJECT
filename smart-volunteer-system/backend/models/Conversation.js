/**
 * models/Conversation.js — Conversation tracking between students and volunteers
 *
 * A conversation represents a matched student-volunteer pair that can exchange messages.
 * Only approved students and volunteers can participate in conversations.
 */

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    // Student participant
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Volunteer participant
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Original matching context (optional)
    matchContext: {
      subject: { type: String, default: '' },
      topic: { type: String, default: '' },
      preferredTime: { type: String, default: '' },
    },
    
    // Conversation status
    status: {
      type: String,
      enum: ['active', 'archived', 'blocked'],
      default: 'active',
    },
    
    // Last message preview for UI
    lastMessage: {
      content: { type: String, default: '' },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: null },
    },
    
    // Unread message counts
    unreadCounts: {
      student: { type: Number, default: 0 },
      volunteer: { type: Number, default: 0 },
    },
    
    // Who archived the conversation (if applicable)
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure unique conversations between student-volunteer pairs
ConversationSchema.index({ studentId: 1, volunteerId: 1 }, { unique: true });
ConversationSchema.index({ studentId: 1, status: 1 });
ConversationSchema.index({ volunteerId: 1, status: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Virtual for getting the other participant
ConversationSchema.virtual('otherParticipant', {
  ref: 'User',
  localField: 'volunteerId',
  foreignField: '_id',
  justOne: true,
  match: function() {
    // This would need to be handled in the query
    return {};
  }
});

module.exports = mongoose.model('Conversation', ConversationSchema);
