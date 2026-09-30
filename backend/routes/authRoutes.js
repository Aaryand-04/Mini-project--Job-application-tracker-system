const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');

const {
  validateRegisterInput,
  validateLoginInput
} = require('../validators/authValidator');

const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
