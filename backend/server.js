const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

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


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

