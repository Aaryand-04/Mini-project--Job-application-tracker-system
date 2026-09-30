const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Target directory for resume uploads
const RESUMES_DIR = path.resolve(__dirname, '..', 'uploads', 'resumes');

// Ensure directory exists
if (!fs.existsSync(RESUMES_DIR)) {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, RESUMES_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const applicantId = req.user ? req.user._id.toString() : 'guest';
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(6).toString('hex');
    // Non-colliding, safe sanitized filename
    cb(null, `resume_${applicantId}_${timestamp}_${randomHex}${ext}`);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mimeType) || 
    // Fallback for some windows doc uploads where mime could be generic octet-stream
    (mimeType === 'application/octet-stream' && isExtAllowed);

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only PDF, DOC, and DOCX files are allowed.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// 5 MB max file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  RESUMES_DIR,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS
};
