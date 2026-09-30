const fs = require('fs');
const mongoose = require('mongoose');
const { Application, JobPosting, Resume, Applicant, Notification } = require('../models');
const {
  notifyRecruiterOnApplication,
  notifyApplicantOnSubmission,
  notifyApplicantOnStatusUpdate
} = require('../services/notificationService');

/**
 * @desc    Submit a new job application
 * @route   POST /api/applications
 * @access  Private (Applicant only)
 */
const createApplication = async (req, res, next) => {
  try {
    const { jobId, resumeId, coverLetter, notes } = req.body;

    // 1. Authenticated applicant context
    const applicantId = req.user._id;

    // Validation: Required inputs
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required.'
      });
    }

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a resume to apply.'
      });
    }

    // 2. Validate that the job exists
    let jobQuery = { jobId: jobId };
    if (mongoose.Types.ObjectId.isValid(jobId)) {
      jobQuery = { $or: [{ _id: jobId }, { jobId: jobId }] };
    }

    const job = await JobPosting.findOne(jobQuery).populate('companyId', 'name email industry location website');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.'
      });
    }

    // 3. Validate that the job is active
    if (!job.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This job posting is inactive or closed and is no longer accepting applications.'
      });
    }

    // 4. Validate that the applicant owns the selected resume
    let resumeQuery = { resumeId: resumeId };
    if (mongoose.Types.ObjectId.isValid(resumeId)) {
      resumeQuery = { $or: [{ _id: resumeId }, { resumeId: resumeId }] };
    }

    const resume = await Resume.findOne(resumeQuery);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Selected resume not found.'
      });
    }

    if (resume.applicantId.toString() !== applicantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only submit applications using a resume that you own.'
      });
    }

    // 5. Prevent duplicate applications for the same applicant and job
    const existingApplication = await Application.findOne({
      applicantId: applicantId,
      jobId: job._id
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an application for this job posting.',
        applicationId: existingApplication.applicationId,
        status: existingApplication.status,
        appliedDate: existingApplication.appliedDate
      });
    }

    // 6 & 7. Create Application and store in MongoDB
    const application = await Application.create({
      applicantId,
      jobId: job._id,
      resumeId: resume._id,
      coverLetter: typeof coverLetter === 'string' ? coverLetter.trim() : '',
      notes: typeof notes === 'string' ? notes.trim() : '',
      status: 'Applied',
      appliedDate: new Date()
    });

    // 8 & 9. Notify the recruiter/company about the new application
    const companyId = job.companyId?._id || job.companyId;
    await notifyRecruiterOnApplication({
      companyId,
      applicant: req.user,
      job,
      application
    });

    // Step 13: Notify the applicant with submission confirmation
    const companyName = job.companyId?.name || 'Company';
    await notifyApplicantOnSubmission({
      applicantId,
      job,
      application,
      companyName
    });

    // Populate for response
    const populatedApplication = await Application.findById(application._id)
      .populate('applicantId', 'name email phone location skills')
      .populate({
        path: 'jobId',
        select: 'jobId title description location type experienceLevel postedDate isActive',
        populate: { path: 'companyId', select: 'companyId name industry location website' }
      })
      .populate('resumeId', 'resumeId fileName fileSize uploadedAt');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application: populatedApplication
    });
  } catch (error) {
    // Handle potential compound unique index collision
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an application for this job posting.'
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all applications submitted by the authenticated applicant
 * @route   GET /api/applications/my
 * @access  Private (Applicant only)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const query = { applicantId: req.user._id };

    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    let applications = await Application.find(query)
      .populate({
        path: 'jobId',
        select: 'jobId title location type experienceLevel postedDate isActive',
        populate: { path: 'companyId', select: 'companyId name industry location website' }
      })
      .populate('resumeId', 'resumeId fileName fileSize uploadedAt')
      .sort({ appliedDate: -1 });

    // Client search filter by job title or company name
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      applications = applications.filter((app) =>
        searchRegex.test(app.jobId?.title) ||
        searchRegex.test(app.jobId?.companyId?.name) ||
        searchRegex.test(app.applicationId)
      );
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single application by ID
 * @route   GET /api/applications/:id
 * @access  Private (Applicant owner or Recruiter of the company)
 */
const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = { applicationId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { applicationId: id }] };
    }

    const application = await Application.findOne(query)
      .populate('applicantId', 'name email phone location skills')
      .populate({
        path: 'jobId',
        populate: { path: 'companyId', select: 'companyId name industry location website' }
      })
      .populate('resumeId', 'resumeId fileName fileSize uploadedAt');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    // Role-based authorization
    const isOwnerApplicant =
      req.role === 'applicant' &&
      application.applicantId._id.toString() === req.user._id.toString();

    const isCompanyRecruiter =
      req.role === 'recruiter' &&
      application.jobId?.companyId?._id?.toString() === req.company._id.toString();

    if (!isOwnerApplicant && !isCompanyRecruiter) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this application.'
      });
    }

    // Ensure statusHistory is populated for timeline presentation
    if (!application.statusHistory || application.statusHistory.length === 0) {
      application.statusHistory = [{
        status: 'Applied',
        changedAt: application.appliedDate || application.createdAt || new Date(),
        notes: 'Application submitted by candidate.'
      }];
      if (application.status === 'Shortlisted') {
        application.statusHistory.push({
          status: 'Shortlisted',
          changedAt: application.updatedAt || new Date()
        });
      } else if (application.status === 'Hired') {
        application.statusHistory.push({
          status: 'Shortlisted',
          changedAt: application.updatedAt || new Date()
        });
        application.statusHistory.push({
          status: 'Hired',
          changedAt: application.updatedAt || new Date()
        });
      } else if (application.status === 'Rejected') {
        application.statusHistory.push({
          status: 'Rejected',
          changedAt: application.updatedAt || new Date()
        });
      }
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications received for the recruiter company's jobs
 * @route   GET /api/applications/recruiter/company
 * @access  Private (Recruiter only)
 */
const getCompanyApplications = async (req, res, next) => {
  try {
    const companyId = req.company._id;

    // Find all jobs for this company
    const companyJobs = await JobPosting.find({ companyId }).select('_id title');
    const jobIds = companyJobs.map((j) => j._id);

    const query = { jobId: { $in: jobIds } };

    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    if (req.query.jobId && req.query.jobId !== 'All') {
      query.jobId = req.query.jobId;
    }

    // Search query for candidate name, email, or job title
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');

      // Find matching applicants
      const matchingApplicants = await Applicant.find({
        $or: [{ name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const matchingApplicantIds = matchingApplicants.map((a) => a._id);

      // Find matching jobs for this company
      const matchingCompanyJobs = companyJobs.filter((j) =>
        searchRegex.test(j.title)
      );
      const matchingJobIds = matchingCompanyJobs.map((j) => j._id);

      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { applicantId: { $in: matchingApplicantIds } },
          { jobId: { $in: matchingJobIds } }
        ]
      });
    }

    const applications = await Application.find(query)
      .populate('applicantId', 'name email phone location skills')
      .populate('jobId', 'jobId title location type experienceLevel postedDate isActive')
      .populate('resumeId', 'resumeId fileName fileSize uploadedAt')
      .sort({ appliedDate: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single application by ID for the recruiter's company
 * @route   GET /api/recruiter/applications/:id
 * @access  Private (Recruiter only)
 */
const getRecruiterApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = { applicationId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { applicationId: id }] };
    }

    const application = await Application.findOne(query)
      .populate('applicantId', 'name email phone location skills')
      .populate({
        path: 'jobId',
        populate: { path: 'companyId', select: 'companyId name industry location website' }
      })
      .populate('resumeId', 'resumeId fileName fileSize uploadedAt');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    // Strict company isolation: Ensure this application belongs to the authenticated recruiter's company
    const jobCompanyId = application.jobId?.companyId?._id?.toString() || application.jobId?.companyId?.toString();
    if (jobCompanyId !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access applications belonging to another company.'
      });
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Securely view/download applicant's resume for a company application
 * @route   GET /api/recruiter/applications/:id/resume
 * @access  Private (Recruiter only)
 */
const getRecruiterApplicationResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDownload = req.query.download === 'true';

    let query = { applicationId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { applicationId: id }] };
    }

    const application = await Application.findOne(query)
      .populate('jobId')
      .populate('resumeId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    // Strict company isolation
    const jobCompanyId = application.jobId?.companyId?.toString();
    if (jobCompanyId !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access resumes for another company.'
      });
    }

    const resume = application.resumeId;
    if (!resume || !resume.filePath || !fs.existsSync(resume.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on disk.'
      });
    }

    const fileName = resume.fileName || 'applicant_resume.pdf';
    const disposition = isDownload ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`;
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Content-Type', resume.mimeType || 'application/pdf');

    const fileStream = fs.createReadStream(resume.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update application status (Activity Diagram Join: Update Application Status)
 * @route   PATCH /api/applications/:id/status or PATCH /api/recruiter/applications/:id/status
 * @access  Private (Recruiter only)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New application status is required.'
      });
    }

    const ALLOWED_STATUSES = ['Shortlisted', 'Rejected', 'Hired'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: '${status}'. Allowed status updates are: ${ALLOWED_STATUSES.join(', ')}.`
      });
    }

    let query = { applicationId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { applicationId: id }] };
    }

    const application = await Application.findOne(query)
      .populate('jobId')
      .populate('applicantId', 'name email phone');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    // Verify that this application belongs to the recruiter's company
    if (application.jobId.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to manage applications for this company.'
      });
    }

    // Update status using model method which validates state transitions
    try {
      await application.updateStatus(status, notes);
    } catch (transitionErr) {
      return res.status(400).json({
        success: false,
        message: transitionErr.message
      });
    }

    // Notify the applicant of status change (Step 13)
    await notifyApplicantOnStatusUpdate({
      applicantId: application.applicantId._id,
      job: application.jobId,
      application,
      newStatus: status,
      companyName: req.company.name
    });

    const populatedApp = await Application.findById(application._id)
      .populate('applicantId', 'name email phone location skills')
      .populate('jobId', 'jobId title location type experienceLevel postedDate isActive')
      .populate('resumeId', 'resumeId fileName fileSize uploadedAt');

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}.`,
      application: populatedApp
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated dashboard stats and recent activity for the authenticated applicant
 * @route   GET /api/applications/dashboard-stats or GET /api/applicant/dashboard
 * @access  Private (Applicant only)
 */
const getApplicantDashboardStats = async (req, res, next) => {
  try {
    const applicantId = req.user._id;

    // 1. Dynamic MongoDB aggregation for status counts (No hardcoded values)
    const statsAggregation = await Application.aggregate([
      { $match: { applicantId: new mongoose.Types.ObjectId(applicantId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      total: 0,
      applied: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0
    };

    statsAggregation.forEach((item) => {
      stats.total += item.count;
      const statusKey = item._id ? item._id.toLowerCase() : '';
      if (statusKey === 'applied') stats.applied = item.count;
      else if (statusKey === 'shortlisted') stats.shortlisted = item.count;
      else if (statusKey === 'rejected') stats.rejected = item.count;
      else if (statusKey === 'hired') stats.hired = item.count;
    });

    // 2. Recent Applications (latest 5 with populated job & company)
    const recentApplications = await Application.find({ applicantId })
      .populate({
        path: 'jobId',
        select: 'jobId title location type experienceLevel postedDate isActive',
        populate: { path: 'companyId', select: 'companyId name industry location website' }
      })
      .populate('resumeId', 'resumeId fileName fileSize')
      .sort({ appliedDate: -1, createdAt: -1 })
      .limit(5);

    // 3. Recent Notifications (latest 5 for this candidate)
    const recentNotifications = await Notification.find({
      $or: [{ applicantId }, { recipientId: applicantId }]
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Active Job Opportunities (latest 6 active jobs from verified companies)
    const activeJobs = await JobPosting.find({ isActive: true })
      .populate('companyId', 'name industry location website')
      .sort({ postedDate: -1, createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      stats,
      recentApplications,
      recentNotifications,
      activeJobs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated recruiter dashboard stats and recent activity directly from MongoDB (Step 15)
 * @route   GET /api/recruiter/dashboard or GET /api/recruiter/applications/dashboard-stats
 * @access  Private (Recruiter only)
 */
const getRecruiterDashboardStats = async (req, res, next) => {
  try {
    const companyId = req.company._id;

    // 1. Dynamic MongoDB job counts
    const [totalJobs, activeJobs, closedJobs, companyJobs] = await Promise.all([
      JobPosting.countDocuments({ companyId }),
      JobPosting.countDocuments({ companyId, isActive: true }),
      JobPosting.countDocuments({ companyId, isActive: false }),
      JobPosting.find({ companyId }).select('_id')
    ]);

    const jobIds = companyJobs.map((j) => j._id);

    // 2. Dynamic MongoDB aggregation for application statuses
    const appStatsAggregation = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      totalJobPostings: totalJobs,
      activeJobs,
      closedJobs,
      totalApplications: 0,
      newApplications: 0, // 'Applied'
      shortlisted: 0,
      rejected: 0,
      hired: 0
    };

    appStatsAggregation.forEach((item) => {
      stats.totalApplications += item.count;
      const statusKey = (item._id || '').toLowerCase();
      if (statusKey === 'applied') stats.newApplications = item.count;
      else if (statusKey === 'shortlisted') stats.shortlisted = item.count;
      else if (statusKey === 'rejected') stats.rejected = item.count;
      else if (statusKey === 'hired') stats.hired = item.count;
    });

    // 3. Recent Applications (latest 5 with candidate and job details)
    const recentApplications = await Application.find({ jobId: { $in: jobIds } })
      .populate('applicantId', 'name email phone location skills')
      .populate('jobId', 'jobId title location type experienceLevel postedDate isActive')
      .populate('resumeId', 'resumeId fileName fileSize')
      .sort({ appliedDate: -1, createdAt: -1 })
      .limit(5);

    // 4. Recent Job Postings (latest 5 created by this company)
    const recentJobs = await JobPosting.find({ companyId })
      .sort({ postedDate: -1, createdAt: -1 })
      .limit(5);

    // 5. Recent Notifications (latest 5 for this company)
    const recentNotifications = await Notification.find({ recipientId: companyId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats,
      recentApplications,
      recentJobs,
      recentNotifications
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationById,
  getCompanyApplications,
  getRecruiterApplicationById,
  getRecruiterApplicationResume,
  updateApplicationStatus,
  getApplicantDashboardStats,
  getRecruiterDashboardStats
};
