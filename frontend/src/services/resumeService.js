import api from './api';

export const resumeService = {
  /**
   * Upload resume file
   * @param {FormData} formData
   * @param {Function} [onUploadProgress]
   */
  async uploadResume(formData, onUploadProgress) {
    const response = await api.post('/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
    return response.data;
  },

  /**
   * Retrieve all resumes uploaded by the current applicant
   */
  async getMyResumes() {
    const response = await api.get('/resumes');
    return response.data;
  },

  /**
   * Get resume metadata by ID
   * @param {string} id - Mongo _id or conceptual resumeId
   */
  async getResume(id) {
    const response = await api.get(`/resumes/${id}?format=json`);
    return response.data;
  },

  /**
   * Securely download or view resume file
   * @param {string} id - Resume ID
   * @param {string} fileName - Expected file name
   */
  async downloadResume(id, fileName) {
    const response = await api.get(`/resumes/${id}?download=true`, {
      responseType: 'blob'
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'resume.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * View resume inline in new window/tab
   * @param {string} id - Resume ID
   */
  async viewResumeInline(id) {
    const response = await api.get(`/resumes/${id}`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },

  /**
   * Delete resume
   * @param {string} id - Resume ID
   */
  async deleteResume(id) {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },

  /**
   * Select resume as primary/default for job applications
   * @param {string} id - Resume ID
   */
  async selectResume(id) {
    const response = await api.patch(`/resumes/${id}/select`);
    return response.data;
  }
};

export default resumeService;
