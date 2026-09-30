const { verifyToken } = require('../utils/jwt');
const { Applicant, Company } = require('../models');

/**
 * Protect Applicant endpoints
 * Verifies JWT and confirms role is 'applicant'
 */
const protectApplicant = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = verifyToken(token);

    // Enforce role separation: Recruiters cannot access Applicant APIs
    if (decoded.role !== 'applicant') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Recruiter accounts cannot access applicant resources.'
      });
    }

    const applicant = await Applicant.findById(decoded.id).select('-password');
    if (!applicant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Applicant account not found.'
      });
    }

    req.user = applicant;
    req.role = 'applicant';
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Token is invalid or expired.'
    });
  }
};

/**
 * Protect Recruiter endpoints
 * Verifies JWT and confirms role is 'recruiter'
 */
const protectRecruiter = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = verifyToken(token);

    // Enforce role separation: Applicants cannot access Recruiter APIs
    if (decoded.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Applicant accounts cannot access recruiter resources.'
      });
    }

    const company = await Company.findById(decoded.id || decoded.companyId).select('-password');
    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Recruiter/Company account not found.'
      });
    }

    req.recruiter = company;
    req.company = company;
    req.role = 'recruiter';
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Token is invalid or expired.'
    });
  }
};

/**
 * Middleware ensuring a recruiter cannot access or mutate another company's job postings
 */
const verifyJobOwnership = async (req, res, next) => {
  try {
    const JobPosting = require('../models/JobPosting');
    const jobId = req.params.id || req.params.jobId;

    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.'
      });
    }

    if (job.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access another company’s job postings.'
      });
    }

    req.jobPosting = job;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Recruiter Authentication (for public routes that can filter by mine=true)
 */
const optionalRecruiterAuth = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded.role === 'recruiter') {
        const company = await Company.findById(decoded.id || decoded.companyId).select('-password');
        if (company) req.company = company;
      }
    } catch (_) {}
  }
  next();
};

/**
 * Protect endpoints accessible by either an authenticated Applicant or Recruiter
 */
const protectApplicantOrRecruiter = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role === 'applicant') {
      const applicant = await Applicant.findById(decoded.id).select('-password');
      if (!applicant) {
        return res.status(401).json({ success: false, message: 'Applicant account not found.' });
      }
      req.user = applicant;
      req.role = 'applicant';
      return next();
    } else if (decoded.role === 'recruiter') {
      const company = await Company.findById(decoded.id || decoded.companyId).select('-password');
      if (!company) {
        return res.status(401).json({ success: false, message: 'Recruiter account not found.' });
      }
      req.recruiter = company;
      req.company = company;
      req.role = 'recruiter';
      return next();
    } else {
      return res.status(403).json({ success: false, message: 'Invalid user role.' });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Token is invalid or expired.'
    });
  }
};

// Aliases for backward compatibility
const protect = protectApplicant;

module.exports = {
  protect,
  protectApplicant,
  protectRecruiter,
  protectApplicantOrRecruiter,
  verifyJobOwnership,
  optionalRecruiterAuth
};
