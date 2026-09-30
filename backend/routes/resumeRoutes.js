const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protectApplicant, protectApplicantOrRecruiter } = require('../middleware/authMiddleware');
const { upload } = require('../config/multer');
const {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
  selectResume
} = require('../controllers/resumeController');

// Wrapper for multer to provide clean error responses
const handleResumeUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');

  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum allowed size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'File upload failed.'
      });
    }
    next();
  });
};

// Applicant-only management routes
router.route('/')
  .post(protectApplicant, handleResumeUpload, uploadResume)
  .get(protectApplicant, getMyResumes);

// GET /:id is accessible by the applicant owner OR by the company recruiter who received an application with it
router.route('/:id')
  .get(protectApplicantOrRecruiter, getResumeById)
  .delete(protectApplicant, deleteResume);

router.patch('/:id/select', protectApplicant, selectResume);

module.exports = router;
