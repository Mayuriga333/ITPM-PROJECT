/**
 * server.js — Merged entry point for the Smart Volunteer Platform
 *
 * Combines all features from:
 *   - Auth, Chatbot & Volunteer Matching (P1)
 *   - Ratings, Reviews & Smart Matching (P2)
 *   - Study Support Requests & Dispute Management (P3)
 */

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const dotenv   = require('dotenv');

// Always load .env from the backend directory, regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files (review attachments from P2)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes: Auth, Chatbot & Admin (from P1) ──────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/chat',     require('./routes/chatRoutes'));
app.use('/api/match',    require('./routes/matchRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// ── Routes: Ratings, Reviews & Smart Matching (from P2) ──────────────────────
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
app.use('/api/reviews',    require('./routes/reviewRoutes'));
app.use('/api/sessions',   require('./routes/sessionRoutes'));
app.use('/api/matching',   require('./routes/matchingRoutes'));

// ── Routes: Study Support Requests & Disputes (from P3) ──────────────────────
app.use('/api/requests',        require('./routes/requestRoutes'));
app.use('/api/study-students',  require('./routes/studyStudentRoutes'));
app.use('/api/study-volunteers', require('./routes/studyVolunteerRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── 404 for unknown API routes ────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [{ path: req.originalUrl, message: 'The requested API endpoint does not exist.' }],
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.stack || err.message);

  // Handle multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Attachment must be 5MB or less' });
    }
    return res.status(400).json({ message: err.message || 'File upload failed' });
  }
  if (err.message && err.message.includes('Only .jpg, .png, and .pdf')) {
    return res.status(400).json({ message: err.message });
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ success: false, message });
});

// ── Connect & Listen ──────────────────────────────────────────────────────────
const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/volunteer_system';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
