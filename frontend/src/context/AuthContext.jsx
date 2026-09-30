import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and verify session on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      if (storedToken && parsedUser) {
        try {
          if (parsedUser.role === 'recruiter') {
            const res = await authService.getRecruiterMe();
            if (res.success && res.company) {
              setUser(res.company);
              localStorage.setItem('user', JSON.stringify(res.company));
            }
          } else {
            const res = await authService.getMe();
            if (res.success && res.user) {
              setUser(res.user);
              localStorage.setItem('user', JSON.stringify(res.user));
            }
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Applicant login
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authService.login({ email, password });
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Applicant registration
  const register = async (applicantData) => {
    setError(null);
    try {
      const res = await authService.register(applicantData);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Recruiter login
  const loginRecruiter = async (email, password) => {
    setError(null);
    try {
      const res = await authService.loginRecruiter({ email, password });
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.company);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.company));
        return { success: true, user: res.company };
      }
      throw new Error(res.message || 'Recruiter login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid recruiter credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Recruiter registration / onboarding
  const registerRecruiter = async (companyData) => {
    setError(null);
    try {
      const res = await authService.registerRecruiter(companyData);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.company);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.company));
        return { success: true, user: res.company };
      }
      throw new Error(res.message || 'Company registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Company registration failed.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    if (user?.role === 'recruiter') {
      await authService.logoutRecruiter();
    } else {
      await authService.logout();
    }
    setUser(null);
    setToken(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    role: user?.role || null,
    isApplicant: user?.role === 'applicant',
    isRecruiter: user?.role === 'recruiter',
    isAuthenticated: !!token && !!user,
    loading,
    error,
    login,
    register,
    loginRecruiter,
    registerRecruiter,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
