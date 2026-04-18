/**
 * routes/chatRoutes.js — All chat endpoints require authentication + Student role
 */

const express = require('express');
const router  = express.Router();

const { sendMessage, getChatHistory, resetChat } = require('../controllers/chatController');
const { protect, authorizeRoles }                = require('../middleware/authMiddleware');

// Only Students can interact with the chatbot
router.use(protect, authorizeRoles('Student'));

router.post('/message', sendMessage);
router.get('/history',  getChatHistory);
router.delete('/reset', resetChat);

module.exports = router;