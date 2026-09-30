const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    index: true,
    default: function () {
      return `APP-${Date.now().toString().slice(-6)}`;
    }
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: [true, 'Applicant reference (applicantId) is required'],
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: [true, 'JobPosting reference (jobId) is required'],
    index: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: [true, 'Resume reference (resumeId) is required'],
    index: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: [true, 'Application status is required'],
    enum: {
      values: ['Applied', 'Shortlisted', 'Rejected', 'Hired', 'Withdrawn'],
      message: '{VALUE} is not a valid application status'
    },
    default: 'Applied',
    index: true
  },
  coverLetter: {
    type: String,
    trim: true,
    default: '',
    maxlength: [5000, 'Cover letter cannot exceed 5000 characters']
  },
  notes: {
    type: String,
    trim: true,
    default: '',
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true,
        enum: ['Applied', 'Shortlisted', 'Rejected', 'Hired', 'Withdrawn']
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      notes: {
        type: String,
        default: ''
      }
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook: Ensure initial Applied event is recorded in statusHistory
ApplicationSchema.pre('save', function (next) {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.status || 'Applied',
      changedAt: this.appliedDate || new Date(),
      notes: 'Application submitted by candidate.'
    }];
  }
  next();
});

// Virtual 'id' representing conceptual ID
ApplicationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Compound unique index: Applicant can submit only one application per JobPosting
ApplicationSchema.index({ applicantId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ appliedDate: -1 });

// Class diagram method: updateStatus(status, evaluationNotes)
ApplicationSchema.methods.updateStatus = async function (newStatus, evaluationNotes) {
  const validTransitions = {
    'Applied': ['Shortlisted', 'Rejected'],
    'Shortlisted': ['Hired', 'Rejected'],
    'Rejected': [],
    'Hired': [],
    'Withdrawn': []
  };

  if (newStatus === this.status) {
    throw new Error(`Application is already in '${this.status}' status.`);
  }

  const allowed = validTransitions[this.status] || [];
  if (!allowed.includes(newStatus)) {
    const allowedText = allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)';
    throw new Error(`Cannot transition application status from '${this.status}' to '${newStatus}'. Allowed transitions from '${this.status}' are: ${allowedText}.`);
  }

  this.status = newStatus;
  if (evaluationNotes !== undefined && evaluationNotes !== null) {
    this.notes = evaluationNotes;
  }

  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    notes: evaluationNotes || ''
  });

  return await this.save();
};

// Class diagram method: withdraw()
ApplicationSchema.methods.withdraw = async function () {
  if (['Rejected', 'Hired', 'Withdrawn'].includes(this.status)) {
    throw new Error(`Cannot withdraw an application that is already ${this.status}`);
  }
  this.status = 'Withdrawn';
  return await this.save();
};

// Class diagram method: viewDetails()
ApplicationSchema.methods.viewDetails = function () {
  return this.populate([
    { path: 'applicantId', select: 'name email phone location skills' },
    { path: 'jobId', populate: { path: 'companyId', select: 'name industry location website' } },
    { path: 'resumeId', select: 'fileName filePath uploadedAt' }
  ]);
};

module.exports = mongoose.model('Application', ApplicationSchema);
