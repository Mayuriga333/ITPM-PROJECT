/**
 * controllers/chatController.js — Rule-based chatbot for requirement collection
 *
 * Conversation flow (steps):
 *   0 → Greeting / intent detection
 *   1 → Ask for Subject
 *   2 → Ask for Topic
 *   3 → Ask for Preferred Time
 *   4 → Complete — display summary and suggest matching
 */

const ChatSession = require('../models/ChatSession');

// ── Static bot responses for each step ───────────────────────────────────────
const BOT_PROMPTS = {
  greeting:
    "👋 Hello! I'm your learning assistant. I'm here to help you find the perfect volunteer tutor. Type **\"help\"** or **\"start\"** to begin!",
  step1:
    '📚 Great! Let\'s start. Which **subject** do you need help with? (e.g., Mathematics, Physics, Chemistry, Biology, Computer Science, English)',
  step2:
    '🔍 Got it! What specific **topic** within that subject are you struggling with? (e.g., Calculus, Quantum Mechanics, Organic Chemistry)',
  step3:
    '🕐 Almost done! What is your **preferred time** for sessions? (e.g., Morning, Afternoon, Evening, Weekend)',
  complete: (data) =>
    `✅ Perfect! Here's a summary of your request:\n\n📖 **Subject:** ${data.subject}\n🔎 **Topic:** ${data.topic}\n🕐 **Preferred Time:** ${data.preferredTime}\n\nI'll now find the **best volunteer matches** for you! Click the **"Find Volunteers"** button below.`,
  notUnderstood:
    "I didn't quite catch that. Please type **\"start\"** or **\"help\"** to begin the process.",
  alreadyComplete:
    '✅ Your requirements have already been collected. Click **"Find Volunteers"** or type **"reset"** to start over.',
  reset: '🔄 Session reset. Type **"start"** or **"help"** to begin again.',
};

// ── Helper: detect user intent at step 0 ─────────────────────────────────────
const isStartIntent = (text) =>
  /\b(help|start|hi|hello|hey|need|find|tutor|volunteer|assist)\b/i.test(text);

const isResetIntent = (text) => /\b(reset|restart|clear|again|new)\b/i.test(text);

/**
 * POST /api/chat/message
 * Body: { message: string }
 * Protected — requires Student role
 */
const sendMessage = async (req, res) => {
  try {
    const userId  = req.user._id;
    const userMsg = (req.body.message || '').trim();

    if (!userMsg) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    // Fetch or create a session for this user
    let session = await ChatSession.findOne({ userId });
    if (!session) {
      session = await ChatSession.create({ userId, currentStep: 0, messages: [] });
    }

    // Record the user's message
    session.messages.push({ sender: 'user', text: userMsg });

    let botReply = '';

    // ── Handle reset intent at any step ──────────────────────────────────────
    if (isResetIntent(userMsg)) {
      session.currentStep   = 0;
      session.collectedData = { subject: '', topic: '', preferredTime: '' };
      botReply = BOT_PROMPTS.reset;
      session.messages.push({ sender: 'bot', text: botReply });
      await session.save();
      return res.json({ success: true, reply: botReply, step: 0, collectedData: session.collectedData });
    }

    // ── State machine ─────────────────────────────────────────────────────────
    switch (session.currentStep) {
      case 0: // Waiting for intent
        if (isStartIntent(userMsg)) {
          botReply           = BOT_PROMPTS.step1;
          session.currentStep = 1;
        } else {
          botReply = BOT_PROMPTS.notUnderstood;
        }
        break;

      case 1: // Collecting subject
        if (userMsg.length < 2) {
          botReply = '⚠️ Please provide a valid subject name (at least 2 characters).';
        } else {
          session.collectedData.subject = userMsg;
          botReply                      = BOT_PROMPTS.step2;
          session.currentStep           = 2;
        }
        break;

      case 2: // Collecting topic
        if (userMsg.length < 2) {
          botReply = '⚠️ Please provide a valid topic (at least 2 characters).';
        } else {
          session.collectedData.topic = userMsg;
          botReply                    = BOT_PROMPTS.step3;
          session.currentStep         = 3;
        }
        break;

      case 3: // Collecting preferred time
        if (userMsg.length < 2) {
          botReply = '⚠️ Please specify a preferred time (e.g., Morning, Evening, Weekend).';
        } else {
          session.collectedData.preferredTime = userMsg;
          botReply                            = BOT_PROMPTS.complete(session.collectedData);
          session.currentStep                 = 4;
        }
        break;

      case 4: // Already complete
        botReply = BOT_PROMPTS.alreadyComplete;
        break;

      default:
        botReply = BOT_PROMPTS.notUnderstood;
    }

    // Record the bot's reply
    session.messages.push({ sender: 'bot', text: botReply });
    session.markModified('collectedData'); // Ensure nested object changes are tracked
    await session.save();

    res.json({
      success:       true,
      reply:         botReply,
      step:          session.currentStep,
      collectedData: session.collectedData,
      isComplete:    session.currentStep === 4,
    });
  } catch (err) {
    console.error('[Chat/sendMessage]', err);
    res.status(500).json({ success: false, message: 'Chat service error.' });
  }
};

/**
 * GET /api/chat/history
 * Returns the full chat history for the authenticated user
 */
const getChatHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user._id });
    if (!session) {
      return res.json({ success: true, messages: [], step: 0, collectedData: {} });
    }
    res.json({
      success:       true,
      messages:      session.messages,
      step:          session.currentStep,
      collectedData: session.collectedData,
      isComplete:    session.currentStep === 4,
    });
  } catch (err) {
    console.error('[Chat/getChatHistory]', err);
    res.status(500).json({ success: false, message: 'Could not retrieve chat history.' });
  }
};

/**
 * DELETE /api/chat/reset
 * Resets the chat session for the authenticated user
 */
const resetChat = async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({ userId: req.user._id });
    res.json({ success: true, message: 'Chat session reset successfully.' });
  } catch (err) {
    console.error('[Chat/resetChat]', err);
    res.status(500).json({ success: false, message: 'Could not reset session.' });
  }
};

module.exports = { sendMessage, getChatHistory, resetChat };