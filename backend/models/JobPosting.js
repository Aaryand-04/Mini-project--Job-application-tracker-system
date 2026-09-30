const mongoose = require('mongoose');

const JobPostingSchema = new mongoose.Schema({
  jobId: {
    type: String,
    unique: true,
    index: true,
    default: function () {
      return `JOB-${Date.now().toString().slice(-6)}`;
    }
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference (companyId) is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [150, 'Job title cannot exceed 150 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Job type is required'],
    enum: {
      values: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
      message: '{VALUE} is not a supported job type'
    }
  },
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: {
      values: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Executive'],
      message: '{VALUE} is not a supported experience level'
    }
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual 'id' representing conceptual ID
JobPostingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Relationship: JobPosting has many Applications
JobPostingSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId'
});

// Indexes for high performance searches
JobPostingSchema.index({ title: 'text', description: 'text', location: 'text' });
JobPostingSchema.index({ companyId: 1, isActive: 1 });
JobPostingSchema.index({ postedDate: -1 });

// Class diagram method: viewDetails
JobPostingSchema.methods.viewDetails = function () {
  return this.populate('companyId');
};

// Class diagram method: updateJob
JobPostingSchema.methods.updateJob = async function (updateData) {
  const allowed = ['title', 'description', 'location', 'type', 'experienceLevel', 'isActive'];
  allowed.forEach((field) => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });
  return await this.save();
};

// Class diagram method: closeJob
JobPostingSchema.methods.closeJob = async function () {
  this.isActive = false;
  return await this.save();
};

// Method: activateJob
JobPostingSchema.methods.activateJob = async function () {
  this.isActive = true;
  return await this.save();
};

// Class diagram method: getApplications
JobPostingSchema.methods.getApplications = async function () {
  return await mongoose.model('Application').find({ jobId: this._id })
    .populate('applicantId')
    .populate('resumeId')
    .sort({ appliedDate: -1 });
};

module.exports = mongoose.model('JobPosting', JobPostingSchema);
