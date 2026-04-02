const mongoose = require('mongoose');

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    // Array of exactly two user ids (student + volunteer)
    members: {
      type: [Schema.Types.ObjectId],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: 'Conversation.members must contain exactly 2 user IDs',
      },
      index: true,
    },

    // Explicit fields to enforce uniqueness per student-volunteer pair
    studentId: { type: Schema.Types.ObjectId, required: true, index: true },
    volunteerId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

// Ensure one unique conversation per student-volunteer pair
conversationSchema.index({ studentId: 1, volunteerId: 1 }, { unique: true });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
