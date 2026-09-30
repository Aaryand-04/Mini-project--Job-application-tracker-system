const validTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const validLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Executive'];

/**
 * Validate JobPosting creation and update body
 */
const validateJobInput = (req, res, next) => {
  const { title, description, location, type, experienceLevel } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Job title is required and must be at least 3 characters long.');
  } else if (title.trim().length > 150) {
    errors.push('Job title cannot exceed 150 characters.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Job description is required and must be at least 10 characters long.');
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    errors.push('Job location is required.');
  }

  if (!type || !validTypes.includes(type)) {
    errors.push(`Job type is required and must be one of: ${validTypes.join(', ')}.`);
  }

  if (!experienceLevel || !validLevels.includes(experienceLevel)) {
    errors.push(`Experience level is required and must be one of: ${validLevels.join(', ')}.`);
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
  validateJobInput,
  validTypes,
  validLevels
};
