/**
 * controllers/messageController.js — Messaging system between students and volunteers
 *
 * Features:
 * - Start conversations with matched volunteers
 * - Send and receive messages
 * - View conversation history
 * - Mark messages as read
 * - List all conversations for a user
 */

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');

/**
 * POST /api/messages/conversations
 * Start a new conversation with a volunteer (Student only)
 * Body: { volunteerId, subject, topic, preferredTime }
 */
const startConversation = async (req, res) => {
  try {
    const { volunteerId, subject, topic, preferredTime } = req.body;
    const studentId = req.user._id;

    // Validate volunteer exists and is approved
    const volunteer = await User.findOne({ _id: volunteerId, role: 'Volunteer', status: 'Approved' });
    if (!volunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found or not approved.' });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      studentId,
      volunteerId,
      status: 'active'
    });

    if (existingConversation) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation already exists.',
        conversationId: existingConversation._id
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      studentId,
      volunteerId,
      matchContext: { subject, topic, preferredTime },
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Conversation started successfully.',
      conversation
    });
  } catch (err) {
    console.error('[Message/startConversation]', err);
    res.status(500).json({ success: false, message: 'Could not start conversation.' });
  }
};

/**
 * POST /api/messages/send
 * Send a message in a conversation
 * Body: { conversationId, content }
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    // Find and validate conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Verify sender is participant in conversation
    if (conversation.studentId.toString() !== senderId.toString() && 
        conversation.volunteerId.toString() !== senderId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this conversation.' });
    }

    // Check if conversation is active
    if (conversation.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Cannot send messages in inactive conversation.' });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      content: content.trim(),
      messageType: 'text'
    });

    // Update conversation's last message and unread counts
    const isStudentSender = conversation.studentId.toString() === senderId.toString();
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content: content.trim(),
        senderId,
        timestamp: new Date()
      },
      $inc: {
        [`unreadCounts.${isStudentSender ? 'volunteer' : 'student'}`]: 1
      }
    });

    // Populate message details for response
    await message.populate('senderId', 'name role');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: message
    });
  } catch (err) {
    console.error('[Message/sendMessage]', err);
    res.status(500).json({ success: false, message: 'Could not send message.' });
  }
};

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let conversations;
    if (userRole === 'Student') {
      conversations = await Conversation.find({ 
        studentId: userId, 
        status: { $in: ['active', 'archived'] }
      })
      .populate('volunteerId', 'name email')
      .populate('lastMessage.senderId', 'name role')
      .sort({ updatedAt: -1 });
    } else if (userRole === 'Volunteer') {
      conversations = await Conversation.find({ 
        volunteerId: userId, 
        status: { $in: ['active', 'archived'] }
      })
      .populate('studentId', 'name email')
      .populate('lastMessage.senderId', 'name role')
      .sort({ updatedAt: -1 });
    } else {
      return res.status(403).json({ success: false, message: 'Invalid role for messaging.' });
    }

    res.json({
      success: true,
      conversations
    });
  } catch (err) {
    console.error('[Message/getConversations]', err);
    res.status(500).json({ success: false, message: 'Could not retrieve conversations.' });
  }
};

/**
 * GET /api/messages/conversations/:conversationId/messages
 * Get all messages in a conversation
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Find and validate conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Verify user is participant in conversation
    if (conversation.studentId.toString() !== userId.toString() && 
        conversation.volunteerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation.' });
    }

    // Get messages with sender details
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });

    // Mark messages as read for this user
    const isStudent = conversation.studentId.toString() === userId.toString();
    await Message.updateMany(
      { 
        conversationId, 
        senderId: { $ne: userId }, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    // Update unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${isStudent ? 'student' : 'volunteer'}`]: 0 }
    });

    res.json({
      success: true,
      messages
    });
  } catch (err) {
    console.error('[Message/getMessages]', err);
    res.status(500).json({ success: false, message: 'Could not retrieve messages.' });
  }
};

/**
 * PUT /api/messages/conversations/:conversationId/archive
 * Archive a conversation
 */
const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Verify user is participant in conversation
    if (conversation.studentId.toString() !== userId.toString() && 
        conversation.volunteerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to archive this conversation.' });
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      status: 'archived',
      archivedBy: userId
    });

    res.json({
      success: true,
      message: 'Conversation archived successfully.'
    });
  } catch (err) {
    console.error('[Message/archiveConversation]', err);
    res.status(500).json({ success: false, message: 'Could not archive conversation.' });
  }
};

/**
 * GET /api/messages/unread-count
 * Get total unread message count for the authenticated user
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let conversations;
    if (userRole === 'Student') {
      conversations = await Conversation.find({ studentId: userId, status: 'active' });
    } else if (userRole === 'Volunteer') {
      conversations = await Conversation.find({ volunteerId: userId, status: 'active' });
    } else {
      return res.status(403).json({ success: false, message: 'Invalid role for messaging.' });
    }

    const totalUnread = conversations.reduce((total, conv) => {
      return total + (userRole === 'Student' ? conv.unreadCounts.student : conv.unreadCounts.volunteer);
    }, 0);

    res.json({
      success: true,
      unreadCount: totalUnread
    });
  } catch (err) {
    console.error('[Message/getUnreadCount]', err);
    res.status(500).json({ success: false, message: 'Could not retrieve unread count.' });
  }
};

module.exports = {
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  archiveConversation,
  getUnreadCount
};
