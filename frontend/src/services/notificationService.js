import api from './api';

export const notificationService = {
  /**
   * Get all notifications for current user/company and unread count
   */
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   */
  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};

export default notificationService;
