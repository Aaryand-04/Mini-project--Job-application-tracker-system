const express = require('express');
const router = express.Router();
const {
  protectApplicant,
  protectRecruiter,
  protectApplicantOrRecruiter
} = require('../middleware/authMiddleware');
const {
  createApplication,
  getMyApplications,
  getApplicationById,
  getCompanyApplications,
  updateApplicationStatus,
  getApplicantDashboardStats
} = require('../controllers/applicationController');

const { validateStatusUpdate } = require('../validators/applicationValidator');

// Step 14: Dynamic Applicant Dashboard Statistics & Activity
router.get('/dashboard-stats', protectApplicant, getApplicantDashboardStats);
router.get('/dashboard', protectApplicant, getApplicantDashboardStats);

// Submit application (Applicant only) or retrieve applications submitted by applicant
router.route('/')
  .get(protectApplicant, getMyApplications)
  .post(protectApplicant, createApplication);

// Retrieve all applications submitted by the logged-in applicant (alias)
router.get('/my', protectApplicant, getMyApplications);

// Retrieve all applications received for the recruiter company's jobs
router.get('/recruiter/company', protectRecruiter, getCompanyApplications);

// Update application status (Recruiter only)
router.patch('/:id/status', protectRecruiter, validateStatusUpdate, updateApplicationStatus);

// Retrieve single application details (Applicant owner or Recruiter of the company)
router.get('/:id', protectApplicantOrRecruiter, getApplicationById);

module.exports = router;
