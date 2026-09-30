import api from './api';

export const applicationService = {
  /**
   * Submit a new job application
   * @param {Object} applicationData - { jobId, resumeId, coverLetter, notes }
   */
  async submitApplication(applicationData) {
    const response = await api.post('/applications', applicationData);
    return response.data;
  },

  /**
   * Get all applications submitted by the logged-in applicant
   * @param {Object} [params] - Query filters { status, search }
   */
  async getApplications(params = {}) {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  /**
   * Get all applications submitted by the logged-in applicant (alias)
   */
  async getMyApplications(params = {}) {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  /**
   * Get a single application by ID
   * @param {string} id - Application ID (MongoDB _id or conceptual applicationId)
   */
  async getApplicationById(id) {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  /**
   * Get all applications received for the recruiter company's jobs
   * @param {Object} [params] - { status, jobId }
   */
  async getCompanyApplications(params = {}) {
    const response = await api.get('/applications/recruiter/company', { params });
    return response.data;
  },

  /**
   * Update application status (Activity Diagram Join: Update Application Status)
   * @param {string} id - Application ID
   * @param {Object} data - { status, notes }
   */
  async updateApplicationStatus(id, data) {
    const response = await api.patch(`/applications/${id}/status`, data);
    return response.data;
  },

  /**
   * Get dynamic aggregated dashboard stats & recent activity for applicant (Step 14)
   */
  async getDashboardData() {
    const response = await api.get('/applications/dashboard-stats');
    return response.data;
  }
};

export default applicationService;
