import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobListPage from './pages/JobListPage';
import JobDetailPage from './pages/JobDetailPage';
import RecruiterLoginPage from './pages/recruiter/RecruiterLoginPage';
import RecruiterRegisterPage from './pages/recruiter/RecruiterRegisterPage';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import RecruiterApplicationsPage from './pages/recruiter/RecruiterApplicationsPage';
import RecruiterApplicationDetailPage from './pages/recruiter/RecruiterApplicationDetailPage';
import ResumeManagementPage from './pages/applicant/ResumeManagementPage';
import JobApplyPage from './pages/applicant/JobApplyPage';
import MyApplicationsPage from './pages/applicant/MyApplicationsPage';
import ApplicantApplicationDetailPage from './pages/applicant/ApplicantApplicationDetailPage';
import ApplicantDashboardPage from './pages/applicant/ApplicantDashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';

function RootRedirect() {
  const { isAuthenticated, isRecruiter, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/jobs" replace />;
  return isRecruiter ? <Navigate to="/recruiter/dashboard" replace /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Applicant Dashboard (Step 14) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['applicant']}>
                    <ApplicantDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Applicant Job Search & Details (Activity Diagram: Search for Jobs -> View Job Details) */}
              <Route path="/jobs" element={<JobListPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />

              {/* Public Applicant Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Public Recruiter Auth Routes */}
              <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
              <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />

              {/* Protected Recruiter Routes (Step 5 & Step 10) */}
              <Route
                path="/recruiter/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/applications"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/applications/:id"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterApplicationDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Applicant Resume Management (Step 7) */}
              <Route
                path="/resumes"
                element={
                  <ProtectedRoute allowedRoles={['applicant']}>
                    <ResumeManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Applicant Application Submission & Status (Step 8) */}
              <Route
                path="/jobs/:id/apply"
                element={
                  <ProtectedRoute allowedRoles={['applicant']}>
                    <JobApplyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute allowedRoles={['applicant']}>
                    <MyApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:id"
                element={
                  <ProtectedRoute allowedRoles={['applicant']}>
                    <ApplicantApplicationDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/jobs" replace />} />
            </Routes>
          </div>

          <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
            Job Application Tracking System &copy; {new Date().getFullYear()} — Built with React, Express & MongoDB
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
