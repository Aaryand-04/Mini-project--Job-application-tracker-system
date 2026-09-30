const { Applicant } = require('../models');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Register a new Applicant
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone = '', location = '', skills = '' } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingApplicant = await Applicant.findOne({ email: normalizedEmail });
    if (existingApplicant) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login instead.'
      });
    }

    // Create new applicant (pre-save hook hashes the password)
    const applicant = await Applicant.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      location: location.trim(),
      skills: typeof skills === 'string' ? skills.trim() : (Array.isArray(skills) ? skills.join(', ') : '')
    });

    // Generate JWT token
    const token = generateToken({
      id: applicant._id,
      email: applicant.email,
      role: 'applicant'
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: applicant.id,
        _id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        location: applicant.location,
        skills: applicant.skills,
        role: 'applicant'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login Applicant
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find applicant with password field selected
    const applicant = await Applicant.findOne({ email: normalizedEmail }).select('+password');

    // Activity diagram: Check Valid User? No -> Show Error Message
    if (!applicant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password and try again.'
      });
    }

    // Validate password using bcrypt
    const isMatch = await applicant.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password and try again.'
      });
    }

    // Activity diagram: Check Valid User? Yes -> continue
    const token = generateToken({
      id: applicant._id,
      email: applicant.email,
      role: 'applicant'
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: applicant.id,
        _id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        location: applicant.location,
        skills: applicant.skills,
        role: 'applicant'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Current Authenticated Applicant Profile
 * @route   GET /api/auth/me
 * @access  Private (Applicant)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user was populated by protect middleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        location: req.user.location,
        skills: req.user.skills,
        role: 'applicant',
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout User
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
