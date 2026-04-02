const express = require('express');

const {
  createConversation,
  getUserConversations,
} = require('../controllers/conversationController');

const router = express.Router();

// POST /api/conversation
router.post('/', createConversation);

// GET /api/conversation/:userId
router.get('/:userId', getUserConversations);

module.exports = router;
