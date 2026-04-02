const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true, index: true },
        senderId: { type: String, required: true },
        senderRole: { type: String, required: true, enum: ['student', 'volunteer'] },
        text: { type: String, required: true, trim: true, maxlength: 5000 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
