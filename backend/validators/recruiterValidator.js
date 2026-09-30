/**
 * Validate Recruiter registration / company onboarding input
 */
const validateRecruiterRegister = (req, res, next) => {
  const { name, email, password, industry, location } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Company name is required and must be at least 2 characters.');
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid recruiter email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (!industry || typeof industry !== 'string' || !industry.trim()) {
    errors.push('Industry is required.');
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    errors.push('Company location is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

/**
 * Validate Recruiter login input
 */
const validateRecruiterLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Recruiter email is required.');
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

module.exports = {
  validateRecruiterRegister,
  validateRecruiterLogin
};
