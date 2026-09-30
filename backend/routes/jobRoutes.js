const express = require('express');
const router = express.Router();

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  closeJob,
  activateJob,
  getJobApplications
} = require('../controllers/jobController');

const {
  protectRecruiter,
  verifyJobOwnership,
  optionalRecruiterAuth
} = require('../middleware/authMiddleware');

const { validateJobInput } = require('../validators/jobValidator');

// Public & Browsing Routes
router.get('/', optionalRecruiterAuth, getJobs);
router.get('/:id', getJobById);

// Recruiter Job Management Routes
router.post('/', protectRecruiter, validateJobInput, createJob);
router.put('/:id', protectRecruiter, verifyJobOwnership, validateJobInput, updateJob);
router.patch('/:id/close', protectRecruiter, verifyJobOwnership, closeJob);
router.patch('/:id/activate', protectRecruiter, verifyJobOwnership, activateJob);
router.get('/:id/applications', protectRecruiter, verifyJobOwnership, getJobApplications);

module.exports = router;
