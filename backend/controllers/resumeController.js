const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Resume } = require('../models');

/**
 * @desc    Upload a new resume
 * @route   POST /api/resumes
 * @access  Private (Applicant only)
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file provided. Please upload a PDF, DOC, or DOCX file.'
      });
    }

    const applicantId = req.user._id;

    // Check if user already has any resumes; if not, make this first one default
    const existingCount = await Resume.countDocuments({ applicantId });
    const isDefault = existingCount === 0;

    const resume = await Resume.create({
      applicantId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      isDefault
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume
    });
  } catch (error) {
    // If database insertion failed, clean up uploaded file from disk
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }
    next(error);
  }
};

/**
 * @desc    Get all resumes for the authenticated applicant
 * @route   GET /api/resumes
 * @access  Private (Applicant only)
 */
const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ applicantId: req.user._id })
      .sort({ isDefault: -1, uploadedAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get or download a single resume by ID
 * @route   GET /api/resumes/:id
 * @access  Private (Applicant owner only)
 */
const getResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by ObjectId or conceptual resumeId
    let query = { resumeId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { resumeId: id }] };
    }

    const resume = await Resume.findOne(query);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Ownership verification: Applicant owner or Recruiter whose company received an application with this resume
    if (req.role === 'applicant') {
      if (resume.applicantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to access another applicant’s resume.'
        });
      }
    } else if (req.role === 'recruiter') {
      const { Application, JobPosting } = require('../models');
      const companyJobs = await JobPosting.find({ companyId: req.company._id }).select('_id');
      const jobIds = companyJobs.map((j) => j._id);
      const appWithResume = await Application.findOne({
        resumeId: resume._id,
        jobId: { $in: jobIds }
      });
      if (!appWithResume) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to access this applicant’s resume.'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Unauthorized access.'
      });
    }

    // Determine if file download or streaming is requested
    const wantsDownload = req.query.download === 'true';
    const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');

    // If download is explicitly requested or client doesn't solely request JSON
    if (wantsDownload || (!acceptsJson && !req.query.format)) {
      const resolvedPath = path.resolve(resume.filePath);
      if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({
          success: false,
          message: 'Resume file not found on disk.'
        });
      }

      if (wantsDownload) {
        return res.download(resolvedPath, resume.fileName);
      } else {
        // Stream or display inline (e.g. browser PDF preview)
        res.setHeader('Content-Disposition', `inline; filename="${resume.fileName}"`);
        if (resume.mimeType) {
          res.setHeader('Content-Type', resume.mimeType);
        }
        return res.sendFile(resolvedPath);
      }
    }

    // Otherwise return metadata JSON
    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete resume by ID
 * @route   DELETE /api/resumes/:id
 * @access  Private (Applicant owner only)
 */
const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = { resumeId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { resumeId: id }] };
    }

    const resume = await Resume.findOne(query);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Strict ownership check
    if (resume.applicantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete another applicant’s resume.'
      });
    }

    const wasDefault = resume.isDefault;

    // Delete disk file & database document
    await resume.deleteFile();

    // If deleted resume was default, pick the next available resume as default
    if (wasDefault) {
      const remainingResume = await Resume.findOne({ applicantId: req.user._id }).sort({ uploadedAt: -1 });
      if (remainingResume) {
        remainingResume.isDefault = true;
        await remainingResume.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Select a resume as default/primary
 * @route   PATCH /api/resumes/:id/select
 * @access  Private (Applicant owner only)
 */
const selectResume = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = { resumeId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { resumeId: id }] };
    }

    const resume = await Resume.findOne(query);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Strict ownership check
    if (resume.applicantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this resume.'
      });
    }

    // Reset default for all other resumes of this applicant
    await Resume.updateMany(
      { applicantId: req.user._id },
      { $set: { isDefault: false } }
    );

    resume.isDefault = true;
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Resume set as primary for job applications',
      resume
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
  selectResume
};
