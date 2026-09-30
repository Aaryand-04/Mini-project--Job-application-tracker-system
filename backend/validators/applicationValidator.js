const ALLOWED_UPDATE_STATUSES = ['Shortlisted', 'Rejected', 'Hired'];

/**
 * Validate application status update request body
 */
const validateStatusUpdate = (req, res, next) => {
  const { status, notes } = req.body;

  if (!status || typeof status !== 'string' || !status.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Application status is required and must be a valid string.'
    });
  }

  const trimmedStatus = status.trim();

  // Validate that status is one of the allowed recruiter update actions
  if (!ALLOWED_UPDATE_STATUSES.includes(trimmedStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status: '${trimmedStatus}'. Allowed status updates are: ${ALLOWED_UPDATE_STATUSES.join(', ')}.`
    });
  }

  // Validate optional reviewer notes length
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Evaluation notes must be a string.'
      });
    }
    if (notes.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation notes cannot exceed 2000 characters.'
      });
    }
  }

  // Normalize status on req.body
  req.body.status = trimmedStatus;
  next();
};

module.exports = {
  ALLOWED_UPDATE_STATUSES,
  validateStatusUpdate
};
