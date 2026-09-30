const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    index: true,
    default: function () {
      return `NOTIF-${Date.now().toString().slice(-6)}`;
    }
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  recipientRole: {
    type: String,
    enum: ['recruiter', 'applicant'],
    required: true,
    index: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    index: true
  },
  type: {
    type: String,
    enum: [
      'APPLICATION_SUBMITTED',
      'APPLICATION_SHORTLISTED',
      'APPLICATION_REJECTED',
      'APPLICATION_HIRED',
      'APPLICATION_STATUS_UPDATE',
      'NEW_APPLICATION',
      'GENERAL'
    ],
    default: 'NEW_APPLICATION'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // Recruiter specific application notification fields (Step 9)
  applicantName: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  applicationStatus: {
    type: String,
    default: 'Applied'
  },
  reviewLink: {
    type: String,
    trim: true
  },
  // Relational references
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual 'id' representing conceptual notification ID
NotificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Pre-save hook: ensure applicantId is populated if recipientRole is applicant
NotificationSchema.pre('save', function (next) {
  if (this.recipientRole === 'applicant' && !this.applicantId) {
    this.applicantId = this.recipientId;
  }
  next();
});

// Compound indexes for fast querying of notifications by role and recipient
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ applicantId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
