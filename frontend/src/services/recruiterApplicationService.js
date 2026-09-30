import api from './api';

export const recruiterApplicationService = {
  /**
   * Get all received applications for the recruiter's company
   * @param {Object} [params] - Query filters (status, jobId, search)
   */
  async getRecruiterApplications(params = {}) {
    const response = await api.get('/recruiter/applications', { params });
    return response.data;
  },

  /**
   * Get a single received application by Mongo _id or conceptual applicationId
   * @param {string} id - Application ID
   */
  async getRecruiterApplicationById(id) {
    const response = await api.get(`/recruiter/applications/${id}`);
    return response.data;
  },

  /**
   * Update application status with optional evaluation notes
   * @param {string} id - Application ID
   * @param {Object} data - { status: string, notes?: string }
   */
  async updateApplicationStatus(id, data) {
    const response = await api.patch(`/recruiter/applications/${id}/status`, data);
    return response.data;
  },

  /**
   * Securely download candidate's resume for an application
   * @param {string} id - Application ID
   * @param {string} fileName - Destination file name
   */
  async downloadApplicationResume(id, fileName = 'candidate_resume.pdf') {
    const response = await api.get(`/recruiter/applications/${id}/resume?download=true`, {
      responseType: 'blob'
    });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  /**
   * Securely open candidate's resume inline in new window
   * @param {string} id - Application ID
   */
  async viewApplicationResume(id) {
    const response = await api.get(`/recruiter/applications/${id}/resume`, {
      responseType: 'blob'
    });

    const fileType = response.headers['content-type'] || 'application/pdf';
    const blob = new Blob([response.data], { type: fileType });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  }
};

export default recruiterApplicationService;
