const { JobPosting, Company, Application } = require('../models');

/**
 * @desc    Create a new Job Posting
 * @route   POST /api/jobs
 * @access  Private (Recruiter only)
 */
const createJob = async (req, res, next) => {
  try {
    const { title, description, location, type, experienceLevel } = req.body;

    // Use Class Diagram method: company.addJobPosting(jobData)
    const job = await req.company.addJobPosting({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      type,
      experienceLevel
    });

    await job.populate('companyId', 'name industry location website companyId');

    return res.status(201).json({
      success: true,
      message: 'Job posting created successfully!',
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Job Postings (Public/Applicant lists active; Recruiter can filter by mine=true)
 * @route   GET /api/jobs
 * @access  Public (Optional Recruiter Auth)
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      search,
      title,
      type,
      experienceLevel,
      location,
      companyId,
      mine,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    // If recruiter requests their own company's jobs
    if (mine === 'true' && req.company) {
      filter.companyId = req.company._id;
    } else if (companyId) {
      filter.companyId = companyId;
      filter.isActive = true;
    } else {
      // General public and applicants ONLY view active jobs
      filter.isActive = true;
    }

    // Title specific search
    if (title && title.trim()) {
      filter.title = { $regex: title.trim(), $options: 'i' };
    }

    // General keyword search across title, description, and location
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex }
      ];
    }

    // Location filter (case-insensitive)
    if (location && location.trim()) {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    // Job Type filter (case-insensitive, handling Full-time vs Full-Time)
    if (type && type !== 'All') {
      const normalizedType = type.trim().replace('-', '[- ]?');
      filter.type = { $regex: new RegExp(`^${normalizedType}$`, 'i') };
    }

    // Experience Level filter (case-insensitive)
    if (experienceLevel && experienceLevel !== 'All') {
      filter.experienceLevel = { $regex: new RegExp(`^${experienceLevel.trim()}$`, 'i') };
    }

    // Sorting: newest (default) vs oldest
    const sortOption = sort === 'oldest' ? { postedDate: 1 } : { postedDate: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      JobPosting.find(filter)
        .populate('companyId', 'name industry location website companyId')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      JobPosting.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      jobs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Single Job Posting Details
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Support MongoDB _id or conceptual jobId (e.g. JOB-123456)
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { jobId: id };

    const job = await JobPosting.findOne(query).populate(
      'companyId',
      'name industry location website companyId'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.'
      });
    }

    return res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Job Posting
 * @route   PUT /api/jobs/:id
 * @access  Private (Recruiter only)
 */
const updateJob = async (req, res, next) => {
  try {
    const job = req.jobPosting; // Attached by verifyJobOwnership
    const { title, description, location, type, experienceLevel, isActive } = req.body;

    const updatedJob = await job.updateJob({
      title: title ? title.trim() : job.title,
      description: description ? description.trim() : job.description,
      location: location ? location.trim() : job.location,
      type: type || job.type,
      experienceLevel: experienceLevel || job.experienceLevel,
      isActive: isActive !== undefined ? isActive : job.isActive
    });

    await updatedJob.populate('companyId', 'name industry location website companyId');

    return res.status(200).json({
      success: true,
      message: 'Job posting updated successfully!',
      job: updatedJob
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Close Job Posting (Activity Diagram: Close Job)
 * @route   PATCH /api/jobs/:id/close
 * @access  Private (Recruiter only)
 */
const closeJob = async (req, res, next) => {
  try {
    const job = req.jobPosting; // Attached by verifyJobOwnership

    await job.closeJob();
    await job.populate('companyId', 'name industry location website companyId');

    return res.status(200).json({
      success: true,
      message: 'Job posting has been closed successfully.',
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activate Job Posting
 * @route   PATCH /api/jobs/:id/activate
 * @access  Private (Recruiter only)
 */
const activateJob = async (req, res, next) => {
  try {
    const job = req.jobPosting; // Attached by verifyJobOwnership

    await job.activateJob();
    await job.populate('companyId', 'name industry location website companyId');

    return res.status(200).json({
      success: true,
      message: 'Job posting has been activated successfully.',
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View Applications Received for a Job
 * @route   GET /api/jobs/:id/applications
 * @access  Private (Recruiter only)
 */
const getJobApplications = async (req, res, next) => {
  try {
    const job = req.jobPosting; // Attached by verifyJobOwnership

    // Class diagram method: job.getApplications()
    const applications = await job.getApplications();

    return res.status(200).json({
      success: true,
      count: applications.length,
      job: {
        id: job.id,
        jobId: job.jobId,
        title: job.title,
        isActive: job.isActive
      },
      applications
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  closeJob,
  activateJob,
  getJobApplications
};
