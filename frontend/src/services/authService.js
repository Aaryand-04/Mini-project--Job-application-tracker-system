import api from './api';

export const authService = {
  // --- Applicant Authentication ---
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  },

  // --- Recruiter / Company Authentication ---
  async registerRecruiter(data) {
    const res = await api.post('/recruiter/auth/register', data);
    return res.data;
  },

  async loginRecruiter(credentials) {
    const res = await api.post('/recruiter/auth/login', credentials);
    return res.data;
  },

  async getRecruiterMe() {
    const res = await api.get('/recruiter/auth/me');
    return res.data;
  },

  async logoutRecruiter() {
    try {
      await api.post('/recruiter/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  }
};
