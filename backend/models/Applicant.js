const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ApplicantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Applicant name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  skills: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual 'id' representing conceptual ID
ApplicantSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Relationship: Applicant has many Applications
ApplicantSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'applicantId'
});

// Relationship: Applicant has many Resumes
ApplicantSchema.virtual('resumes', {
  ref: 'Resume',
  localField: '_id',
  foreignField: 'applicantId'
});

// Hash password before saving
ApplicantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password verification method
ApplicantSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Class diagram method: updateProfile
ApplicantSchema.methods.updateProfile = async function (profileData) {
  const allowedUpdates = ['name', 'phone', 'location', 'skills'];
  allowedUpdates.forEach((field) => {
    if (profileData[field] !== undefined) {
      this[field] = profileData[field];
    }
  });
  return await this.save();
};

// Class diagram method: viewApplications
ApplicantSchema.methods.viewApplications = async function () {
  return await mongoose.model('Application').find({ applicantId: this._id })
    .populate('jobId')
    .populate('resumeId')
    .sort({ appliedDate: -1 });
};

// Class diagram method: applyForJob
ApplicantSchema.methods.applyForJob = async function (jobId, { resumeId, coverLetter = '' }) {
  const Application = mongoose.model('Application');
  const existing = await Application.findOne({ applicantId: this._id, jobId });
  if (existing) {
    throw new Error('You have already applied for this job');
  }

  return await Application.create({
    applicantId: this._id,
    jobId,
    resumeId,
    coverLetter
  });
};

module.exports = mongoose.model('Applicant', ApplicantSchema);
