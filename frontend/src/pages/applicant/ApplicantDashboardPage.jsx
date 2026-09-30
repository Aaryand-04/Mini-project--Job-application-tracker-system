import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicationService } from '../../services/applicationService';
import { StatusBadge } from '../../utils/statusBadges';
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Clock,
  XCircle,
  Award,
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  ExternalLink,
  Loader2,
  TrendingUp,
  Search,
  Eye,
  AlertCircle
} from 'lucide-react';

export default function ApplicantDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: { total: 0, applied: 0, shortlisted: 0, rejected: 0, hired: 0 },
    recentApplications: [],
    recentNotifications: [],
    activeJobs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationService.getDashboardData();
      if (res.success) {
        setData({
          stats: res.stats || { total: 0, applied: 0, shortlisted: 0, rejected: 0, hired: 0 },
          recentApplications: res.recentApplications || [],
          recentNotifications: res.recentNotifications || [],
          activeJobs: res.activeJobs || []
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 24);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'APPLICATION_SHORTLISTED':
        return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
      case 'APPLICATION_HIRED':
        return <Award className="w-3.5 h-3.5 text-emerald-600" />;
      case 'APPLICATION_REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading your live dashboard...</p>
      </div>
    );
  }

  const { stats, recentApplications, recentNotifications, activeJobs } = data;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-20">
      {/* 1. Header / Welcome Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Candidate Workspace
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Welcome, {user?.name || 'Applicant'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Here is a live summary of your active applications, status progression, and new requisitions.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/jobs"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Open Jobs</span>
              </Link>
              <Link
                to="/resumes"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>My Resumes</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDashboard}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Stat Cards Grid (Total, Applied, Shortlisted, Rejected, Hired) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Applications */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.total}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Total Submitted</p>
            </div>
          </div>

          {/* Applied */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200/60 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Applied</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">
                {stats.applied}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Pending Review</p>
            </div>
          </div>

          {/* Shortlisted */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Shortlisted</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
                {stats.shortlisted}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Advanced Stage</p>
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/60 shadow-sm hover:border-rose-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Rejected</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">
                {stats.rejected}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Not Selected</p>
            </div>
          </div>

          {/* Hired */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/60 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Hired</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
                {stats.hired}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Offers Accepted</p>
            </div>
          </div>
        </div>

        {/* 3. Main Split Section: Recent Applications & Recent Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Main 2 Cols: Recent Applications */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Recent Applications
                </h2>
                <p className="text-xs text-slate-500">
                  Your most recent job application submissions and live statuses
                </p>
              </div>
              <Link
                to="/applications"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {recentApplications.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No applications yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Start applying to verified job opportunities to track your review progress here.
                  </p>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <span>Browse Open Positions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Job Title</th>
                        <th className="py-3 px-4">Date Applied</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {recentApplications.map((app) => {
                        const job = app.jobId;
                        const company = job?.companyId;

                        return (
                          <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-3.5 h-3.5" />
                                </div>
                                <span>{company?.name || 'Company'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900">{job?.title || 'Job Title'}</span>
                                <span className="text-[10px] text-slate-400">{job?.location || 'Location'} • {job?.type || 'Full-time'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <StatusBadge status={app.status} />
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <Link
                                to={`/applications/${app._id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                              >
                                <span>Timeline</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Recent Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Recent Notifications
                </h2>
                <p className="text-xs text-slate-500">Live alerts & updates</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 divide-y divide-slate-100">
              {recentNotifications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">No notifications yet</p>
                  <p className="text-[11px] text-slate-400">
                    Status changes and confirmations will appear here in real-time.
                  </p>
                </div>
              ) : (
                recentNotifications.map((notif) => {
                  return (
                    <div key={notif._id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.applicationId && (
                          <Link
                            to={`/applications/${notif.applicationId?._id || notif.applicationId}`}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 pt-1"
                          >
                            <span>View Requisition</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 4. Active Job Opportunities Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Active Job Opportunities
              </h2>
              <p className="text-xs text-slate-500">
                Explore open positions from verified employers
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>Explore All Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeJobs.map((job) => (
              <div
                key={job._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {job.type || 'Full-time'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(job.postedDate || job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">{job.companyId?.name || 'Company'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{job.location || 'Remote'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {job.experienceLevel || 'All Levels'}
                  </span>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    <span>View Job</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
