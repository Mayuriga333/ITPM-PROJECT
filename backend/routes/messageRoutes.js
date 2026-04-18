/**
 * routes/messageRoutes.js — Messaging system endpoints
 */

const express = require('express');
const router  = express.Router();

const {
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  archiveConversation,
  getUnreadCount
} = require('../controllers/messageController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Student: start conversation with matched volunteer
router.post('/conversations', protect, authorizeRoles('Student'), startConversation);

// All authenticated users: send messages
router.post('/send', protect, sendMessage);

// All authenticated users: get their conversations
router.get('/conversations', protect, getConversations);

// All authenticated users: get messages in a conversation
router.get('/conversations/:conversationId/messages', protect, getMessages);

// All authenticated users: archive a conversation
router.put('/conversations/:conversationId/archive', protect, archiveConversation);

// All authenticated users: get unread message count
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
