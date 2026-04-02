const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Student = require('../models/Student');
const Volunteer = require('../models/Volunteer');

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

// POST /api/conversation
// Create a new conversation for a student-volunteer pair.
// Ensures uniqueness by (studentId, volunteerId) unique index.
exports.createConversation = async (req, res) => {
  try {
    const { studentId, volunteerId } = req.body || {};

    if (!isValidObjectId(studentId) || !isValidObjectId(volunteerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId or volunteerId',
      });
    }

    if (studentId === volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and volunteerId must be different',
      });
    }

    const [studentExists, volunteerExists] = await Promise.all([
      Student.exists({ _id: studentId }),
      Volunteer.exists({ _id: volunteerId }),
    ]);

    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (!volunteerExists) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    let conversation;
    let created = true;
    try {
      conversation = await Conversation.create({
        studentId,
        volunteerId,
        members: [studentId, volunteerId],
      });
    } catch (err) {
      // Duplicate key -> conversation already exists
      if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
        conversation = await Conversation.findOne({ studentId, volunteerId });
        created = false;
      } else {
        throw err;
      }
    }

    if (!conversation) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create or retrieve conversation',
      });
    }

    return res.status(created ? 201 : 200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/conversation/:userId
// Get all conversations for a user.
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const conversations = await Conversation.find({
      $or: [{ studentId: userId }, { volunteerId: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
