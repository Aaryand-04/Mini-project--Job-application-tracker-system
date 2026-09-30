const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Initial DB connection error:', err.message);
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: Uploaded resumes are protected assets served securely via /api/resumes/:id after owner verification

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Job Application Tracking System API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const recruiterAuthRoutes = require('./routes/recruiterAuthRoutes');
const jobRoutes = require('./routes/jobRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const recruiterApplicationRoutes = require('./routes/recruiterApplicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/recruiter/auth', recruiterAuthRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recruiter/applications', recruiterApplicationRoutes);
app.use('/api/notifications', notificationRoutes);

// Step 14: Dedicated Applicant Dashboard API
const { protectApplicant, protectRecruiter } = require('./middleware/authMiddleware');
const {
  getApplicantDashboardStats,
  getRecruiterDashboardStats
} = require('./controllers/applicationController');

app.get('/api/applicant/dashboard', protectApplicant, getApplicantDashboardStats);

// Step 15: Dedicated Recruiter Dashboard API
app.get('/api/recruiter/dashboard', protectRecruiter, getRecruiterDashboardStats);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server only if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 Client URL allowed: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
}

module.exports = app;
