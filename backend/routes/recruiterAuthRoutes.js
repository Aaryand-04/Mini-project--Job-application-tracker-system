const express = require('express');
const router = express.Router();

const {
  registerRecruiter,
  loginRecruiter,
  getRecruiterMe,
  logoutRecruiter
} = require('../controllers/recruiterAuthController');

const {
  validateRecruiterRegister,
  validateRecruiterLogin
} = require('../validators/recruiterValidator');

const { protectRecruiter } = require('../middleware/authMiddleware');

// Public recruiter routes
router.post('/register', validateRecruiterRegister, registerRecruiter);
router.post('/login', validateRecruiterLogin, loginRecruiter);
router.post('/logout', logoutRecruiter);

// Protected recruiter routes (Only Recruiter accounts can access)
router.get('/me', protectRecruiter, getRecruiterMe);

module.exports = router;
