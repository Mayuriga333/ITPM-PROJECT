/**
 * models/Message.js — Messaging system between students and volunteers
 *
 * Messages are organized by conversations between a student and volunteer.
 * Each conversation represents a matched pair that can exchange messages.
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    // The conversation this message belongs to
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    
    // Sender of the message (either student or volunteer)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Content of the message
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: 1000,
    },
    
    // Message type for future extensibility
    messageType: {
      type: String,
      enum: ['text', 'file', 'image'],
      default: 'text',
    },
    
    // Read status tracking
    isRead: {
      type: Boolean,
      default: false,
    },
    
    // Read timestamp
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1 });

module.exports = mongoose.model('Message', MessageSchema);
