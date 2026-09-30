const express = require('express');
const router = express.Router();
const { protectApplicantOrRecruiter } = require('../middleware/authMiddleware');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// All notification routes are protected
router.use(protectApplicantOrRecruiter);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
