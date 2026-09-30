const mongoose = require('mongoose');
const { Notification } = require('../models');

/**
 * @desc    Get all notifications for the authenticated user (recruiter or applicant)
 * @route   GET /api/notifications
 * @access  Private (Authenticated Recruiter or Applicant)
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const userFilter = req.role === 'recruiter'
      ? { recipientId: req.company._id }
      : { $or: [{ applicantId: req.user._id }, { recipientId: req.user._id }] };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(userFilter)
        .populate({
          path: 'applicationId',
          select: 'applicationId status appliedDate jobId'
        })
        .populate({
          path: 'jobId',
          select: 'title location type companyId',
          populate: { path: 'companyId', select: 'name' }
        })
        .sort({ createdAt: -1 }),
      Notification.countDocuments({
        ...userFilter,
        isRead: false
      })
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.role === 'recruiter' ? req.company._id.toString() : req.user._id.toString();

    let query = { notificationId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { notificationId: id }] };
    }

    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const notifRecipient = notification.recipientId?.toString();
    const notifApplicant = notification.applicantId?.toString();

    if (notifRecipient !== ownerId && notifApplicant !== ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this notification.'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userFilter = req.role === 'recruiter'
      ? { recipientId: req.company._id, isRead: false }
      : {
          $and: [
            { $or: [{ applicantId: req.user._id }, { recipientId: req.user._id }] },
            { isRead: false }
          ]
        };

    const updateResult = await Notification.updateMany(
      userFilter,
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
