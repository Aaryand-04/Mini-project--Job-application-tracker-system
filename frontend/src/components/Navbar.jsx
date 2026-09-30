import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Building2, LogOut, User, Search, Sparkles, FileText, Send } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isApplicant, isRecruiter, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const wasRecruiter = isRecruiter;
    await logout();
    navigate(wasRecruiter ? '/recruiter/login' : '/login');
  };

  return (
    <nav className={`border-b sticky top-0 z-40 transition-all ${
      isRecruiter
        ? 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-md'
        : 'bg-white/90 border-slate-200 text-slate-900 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to={isRecruiter ? '/recruiter/dashboard' : '/'} className="flex items-center space-x-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform ${
              isRecruiter
                ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-indigo-500/20'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-blue-500/20'
            }`}>
              {isRecruiter ? <Building2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <div>
              <span className={`text-lg font-bold tracking-tight ${
                isRecruiter ? 'text-white' : 'text-slate-900'
              }`}>
                JobTrack
              </span>
              <span className={`hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                isRecruiter
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {isRecruiter ? 'Recruiter Portal' : 'Applicant Portal'}
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {isApplicant && (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/jobs"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-500" />
                      <span>Search Jobs</span>
                    </Link>
                    <Link
                      to="/resumes"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>My Resumes</span>
                    </Link>
                    <Link
                      to="/applications"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-500" />
                      <span>My Applications</span>
                    </Link>

                    {/* Step 13: Applicant Notification Bell */}
                    <NotificationBell />
                  </>
                )}

                {isRecruiter && (
                  <>
                    <Link
                      to="/recruiter/dashboard"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/recruiter/applications"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Applications</span>
                    </Link>
                  </>
                )}

                {/* User / Company badge */}
                <div className={`hidden sm:flex items-center gap-2 pl-3 border-l ${
                  isRecruiter ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-xs ${
                    isRecruiter
                      ? 'bg-indigo-950 border-indigo-700 text-indigo-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : (isRecruiter ? 'C' : 'A')}
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-semibold leading-none ${isRecruiter ? 'text-white' : 'text-slate-900'}`}>
                      {user?.name}
                    </p>
                    <p className={`text-[10px] leading-none mt-1 ${isRecruiter ? 'text-slate-400' : 'text-slate-500'}`}>
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg transition-all cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Applicant Sign In
                </Link>
                <Link
                  to="/recruiter/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Recruiter Portal</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
