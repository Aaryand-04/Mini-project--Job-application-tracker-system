const { Company } = require('../models');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Register a new Company / Recruiter account
 * @route   POST /api/recruiter/auth/register
 * @access  Public
 */
const registerRecruiter = async (req, res, next) => {
  try {
    const { name, email, password, industry, location, website = '' } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if company name is already registered
    const existingCompany = await Company.findOne({
      $or: [
        { email: normalizedEmail },
        { name: name.trim() }
      ]
    });

    if (existingCompany) {
      const isEmailMatch = existingCompany.email === normalizedEmail;
      return res.status(400).json({
        success: false,
        message: isEmailMatch
          ? 'A recruiter account with this email already exists.'
          : 'A company with this name has already been registered.'
      });
    }

    const company = await Company.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      industry: industry.trim(),
      location: location.trim(),
      website: website.trim()
    });

    // Generate JWT token with role 'recruiter' and companyId
    const token = generateToken({
      id: company._id,
      companyId: company._id,
      email: company.email,
      role: 'recruiter'
    });

    return res.status(201).json({
      success: true,
      message: 'Recruiter account registered successfully!',
      token,
      company: {
        id: company.id,
        _id: company._id,
        companyId: company.companyId,
        name: company.name,
        email: company.email,
        industry: company.industry,
        location: company.location,
        website: company.website,
        role: 'recruiter'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login to Recruiter Account (Activity Diagram: Login to Recruiter Account)
 * @route   POST /api/recruiter/auth/login
 * @access  Public
 */
const loginRecruiter = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const company = await Company.findOne({ email: normalizedEmail }).select('+password');

    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'Invalid recruiter credentials. Please check your email and password.'
      });
    }

    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid recruiter credentials. Please check your email and password.'
      });
    }

    const token = generateToken({
      id: company._id,
      companyId: company._id,
      email: company.email,
      role: 'recruiter'
    });

    return res.status(200).json({
      success: true,
      message: 'Recruiter login successful!',
      token,
      company: {
        id: company.id,
        _id: company._id,
        companyId: company.companyId,
        name: company.name,
        email: company.email,
        industry: company.industry,
        location: company.location,
        website: company.website,
        role: 'recruiter'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Current Authenticated Recruiter Profile
 * @route   GET /api/recruiter/auth/me
 * @access  Private (Recruiter only)
 */
const getRecruiterMe = async (req, res, next) => {
  try {
    // req.company was attached by protectRecruiter middleware
    const JobPosting = require('../models/JobPosting');
    const jobCount = await JobPosting.countDocuments({ companyId: req.company._id });

    return res.status(200).json({
      success: true,
      company: {
        id: req.company.id,
        _id: req.company._id,
        companyId: req.company.companyId,
        name: req.company.name,
        email: req.company.email,
        industry: req.company.industry,
        location: req.company.location,
        website: req.company.website,
        role: 'recruiter',
        totalJobPostings: jobCount,
        createdAt: req.company.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout Recruiter
 * @route   POST /api/recruiter/auth/logout
 * @access  Public / Private
 */
const logoutRecruiter = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Recruiter logged out successfully.'
  });
};

module.exports = {
  registerRecruiter,
  loginRecruiter,
  getRecruiterMe,
  logoutRecruiter
};
