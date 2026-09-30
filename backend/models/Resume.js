const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const ResumeSchema = new mongoose.Schema({
  resumeId: {
    type: String,
    unique: true,
    index: true,
    default: function () {
      return `RES-${Date.now().toString().slice(-6)}`;
    }
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: [true, 'Applicant reference (applicantId) is required'],
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      // Do not expose arbitrary filesystem paths to users
      ret.fileUrl = `/api/resumes/${ret._id}`;
      ret.downloadUrl = `/api/resumes/${ret._id}?download=true`;
      ret.filePath = `/api/resumes/${ret._id}`;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      ret.fileUrl = `/api/resumes/${ret._id}`;
      ret.downloadUrl = `/api/resumes/${ret._id}?download=true`;
      ret.filePath = `/api/resumes/${ret._id}`;
      return ret;
    }
  }
});

// Virtual 'id' representing conceptual ID
ResumeSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Class diagram method: upload (static creation helper)
ResumeSchema.statics.upload = async function ({ applicantId, fileName, filePath, fileSize, mimeType, isDefault }) {
  return await this.create({
    applicantId,
    fileName,
    filePath,
    fileSize,
    mimeType,
    isDefault
  });
};

// Class diagram method: delete (instance removal + file cleanup)
ResumeSchema.methods.deleteFile = async function () {
  try {
    const targetPath = path.resolve(this.filePath);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  } catch (err) {
    console.warn(`Could not delete file from disk at ${this.filePath}:`, err.message);
  }
  return await this.deleteOne();
};

// Class diagram method: getFile
ResumeSchema.methods.getFile = function () {
  const targetPath = path.resolve(this.filePath);
  return {
    fileName: this.fileName,
    filePath: this.filePath,
    exists: fs.existsSync(targetPath)
  };
};

module.exports = mongoose.model('Resume', ResumeSchema);
