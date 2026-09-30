import api from './api';

export const jobService = {
  /**
   * Fetch public active jobs with filters & search
   */
  async getJobs(params = {}) {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  /**
   * Fetch logged-in recruiter's own company jobs (active + closed)
   */
  async getMyJobs() {
    const res = await api.get('/jobs', { params: { mine: 'true' } });
    return res.data;
  },

  /**
   * Get single job details
   */
  async getJobById(id) {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  /**
   * Create a new job posting (Recruiter only)
   */
  async createJob(jobData) {
    const res = await api.post('/jobs', jobData);
    return res.data;
  },

  /**
   * Update an existing job posting (Recruiter only)
   */
  async updateJob(id, jobData) {
    const res = await api.put(`/jobs/${id}`, jobData);
    return res.data;
  },

  /**
   * Close a job posting (sets isActive: false)
   */
  async closeJob(id) {
    const res = await api.patch(`/jobs/${id}/close`);
    return res.data;
  },

  /**
   * Activate a closed job posting (sets isActive: true)
   */
  async activateJob(id) {
    const res = await api.patch(`/jobs/${id}/activate`);
    return res.data;
  },

  /**
   * Get applications received for a specific job posting
   */
  async getJobApplications(id) {
    const res = await api.get(`/jobs/${id}/applications`);
    return res.data;
  },

  /**
   * Fetch recruiter dashboard statistics & recent data calculated from MongoDB (Step 15)
   */
  async getRecruiterDashboardData() {
    const res = await api.get('/recruiter/dashboard');
    return res.data;
  }
};
