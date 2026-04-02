const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

const registerChatHandlers = require('./sockets/chat');
const registerDirectMessagingHandlers = require('./sockets/directMessaging');

// Load environment variables first
dotenv.config();

const app = express();

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        credentials: true,
    })
);
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: FRONTEND_ORIGIN,
        credentials: true,
    },
});

registerChatHandlers(io);
registerDirectMessagingHandlers(io);

// Debug: Check if MONGODB_URL is loaded
console.log('MONGODB_URI:', process.env.MONGO_URI);

const URL = process.env.MONGO_URI || 'mongodb+srv://kavinduhewamadduma:lrJhe9GXtSojVmrw@cluster0.rv2ijhs.mongodb.net/Doctor_Prescriptions?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(URL)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/conversation', require('./routes/conversationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok' });
});

// 404 for unknown API routes
app.use('/api', (req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Route not found',
        errors: [
            {
                path: req.originalUrl,
                message: 'The requested API endpoint does not exist.',
            },
        ],
    });
});

// Centralized error handling middleware (fallback)
app.use((err, req, res, next) => {
    console.error(err.stack || err);

    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';
    const errors = err.errors || [
        {
            path: null,
            message,
        },
    ];

    res.status(status).json({
        success: false,
        message,
        errors,
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        console.error('Stop the other process or start this server with a different port, e.g. set PORT=5055.');
        process.exit(1);
    }

    console.error('Server failed to start:', err);
    process.exit(1);
});

