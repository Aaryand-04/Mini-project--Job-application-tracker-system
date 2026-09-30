const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CompanySchema = new mongoose.Schema({
  companyId: {
    type: String,
    unique: true,
    index: true,
    default: function () {
      return `COM-${Date.now().toString().slice(-6)}`;
    }
  },
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Company name must be at least 2 characters long'],
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Company location is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true,
    default: '',
    match: [
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$|^$/,
      'Please enter a valid website URL'
    ]
  },
  // Recruiter credentials for authentication
  email: {
    type: String,
    required: [true, 'Recruiter account email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
      'Please enter a valid recruiter email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Recruiter password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  role: {
    type: String,
    default: 'recruiter',
    enum: ['recruiter']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual 'id' representing conceptual ID
CompanySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Relationship: Company has many JobPostings
CompanySchema.virtual('jobPostings', {
  ref: 'JobPosting',
  localField: '_id',
  foreignField: 'companyId'
});

// Hash password before save
CompanySchema.pre('save', async function (next) {
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
CompanySchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Class diagram method: addJobPosting
CompanySchema.methods.addJobPosting = async function (jobData) {
  const JobPosting = mongoose.model('JobPosting');
  return await JobPosting.create({
    ...jobData,
    companyId: this._id
  });
};

// Class diagram method: updateCompany
CompanySchema.methods.updateCompany = async function (updateData) {
  const allowed = ['name', 'industry', 'location', 'website'];
  allowed.forEach((field) => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });
  return await this.save();
};

// Class diagram method: viewJobPostings
CompanySchema.methods.viewJobPostings = async function () {
  return await mongoose.model('JobPosting').find({ companyId: this._id })
    .sort({ postedDate: -1 });
};

module.exports = mongoose.model('Company', CompanySchema);
