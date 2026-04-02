const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

// GET /api/messages/:conversationId
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId',
      });
    }

    const convoExists = await Conversation.exists({ _id: conversationId });
    if (!convoExists) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body || {};

    if (!isValidObjectId(conversationId) || !isValidObjectId(senderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationId or senderId',
      });
    }

    const trimmedText = typeof text === 'string' ? text.trim() : '';
    if (!trimmedText) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const senderIsMember = conversation.members
      .map((m) => String(m))
      .includes(String(senderId));

    if (!senderIsMember) {
      return res.status(403).json({
        success: false,
        message: 'Sender is not a member of this conversation',
      });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      text: trimmedText,
    });

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
