const express = require('express');
const router = express.Router();
const { protectRecruiter } = require('../middleware/authMiddleware');
const {
  getCompanyApplications,
  getRecruiterApplicationById,
  getRecruiterApplicationResume,
  updateApplicationStatus,
  getRecruiterDashboardStats
} = require('../controllers/applicationController');

// All recruiter application routes are protected strictly for recruiters
router.use(protectRecruiter);

// Step 15: Recruiter Dashboard Stats from MongoDB
router.get('/dashboard-stats', getRecruiterDashboardStats);
router.get('/dashboard', getRecruiterDashboardStats);

/**
 * @route   GET /api/recruiter/applications
 * @desc    View all received applications for jobs belonging to the recruiter's company
 * @access  Private (Recruiter only)
 */
router.get('/', getCompanyApplications);

/**
 * @route   GET /api/recruiter/applications/:id
 * @desc    View single received application details with strict cross-company isolation
 * @access  Private (Recruiter only)
 */
router.get('/:id', getRecruiterApplicationById);

const { validateStatusUpdate } = require('../validators/applicationValidator');

/**
 * @route   PATCH /api/recruiter/applications/:id/status
 * @desc    Update application status (Applied -> Shortlisted / Rejected / Hired)
 * @access  Private (Recruiter only)
 */
router.patch('/:id/status', validateStatusUpdate, updateApplicationStatus);

/**
 * @route   GET /api/recruiter/applications/:id/resume
 * @desc    Securely view/download applicant's resume for this specific company application
 * @access  Private (Recruiter only)
 */
router.get('/:id/resume', getRecruiterApplicationResume);

module.exports = router;
