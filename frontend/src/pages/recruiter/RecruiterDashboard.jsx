import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
import { notificationService } from '../../services/notificationService';
import { resumeService } from '../../services/resumeService';
import {
  Building2,
  Briefcase,
  Users,
  PlusCircle,
  ExternalLink,
  MapPin,
  Globe,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Eye,
  Search,
  Filter,
  AlertCircle,
  X,
  Loader2,
  Power,
  Bell,
  Download,
  FileText,
  UserCheck,
  UserX,
  Award,
  Sparkles,
  Send,
  Check
} from 'lucide-react';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Executive'];
const APPLICATION_STATUSES = ['All', 'Applied', 'Shortlisted', 'Hired', 'Rejected'];

export default function RecruiterDashboard() {
  const { user } = useAuth();

  // Active Tab: 'overview' | 'jobs' | 'applications'
  const [activeTab, setActiveTab] = useState('overview');

  // Recruiter Real MongoDB Aggregated Dashboard Data (Step 15)
  const [dashboardStats, setDashboardStats] = useState({
    totalJobPostings: 0,
    activeJobs: 0,
    closedJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state for Jobs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Closed'

  // Modal states for Jobs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false);

  // Selected job for edit/view/applications
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobApplications, setJobApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Notifications State (Step 9)
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Company Applications State (Step 9)
  const [companyApplications, setCompanyApplications] = useState([]);
  const [loadingCompanyApps, setLoadingCompanyApps] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appSearchQuery, setAppSearchQuery] = useState('');

  // Application Review Modal State (Step 9 Join: Update Application Status)
  const [selectedReviewApp, setSelectedReviewApp] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState(null);
  const [statusUpdateError, setStatusUpdateError] = useState(null);

  // Form state for Create / Edit Job
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'Full-time',
    experienceLevel: 'Mid Level'
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchMyJobs();
    fetchNotifications();
    fetchCompanyApplications();
  }, []);

  // Fetch real aggregated recruiter dashboard stats from MongoDB (Step 15)
  const fetchDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      const res = await jobService.getRecruiterDashboardData();
      if (res.success) {
        if (res.stats) setDashboardStats(res.stats);
        if (res.recentApplications) setRecentApplications(res.recentApplications);
        if (res.recentJobs) setRecentJobs(res.recentJobs);
        if (res.recentNotifications) setRecentNotifications(res.recentNotifications);
      }
    } catch (err) {
      console.warn('Could not fetch recruiter dashboard stats:', err.message);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch recruiter's company jobs
  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await jobService.getMyJobs();
      if (res.success) {
        setJobs(res.jobs || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load company job postings.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch company notifications (Step 9)
  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadNotifCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err.message);
    }
  };

  // Fetch all received applications across company jobs (Step 9)
  const fetchCompanyApplications = async () => {
    try {
      setLoadingCompanyApps(true);
      const res = await applicationService.getCompanyApplications();
      if (res.success) {
        setCompanyApplications(res.applications || []);
      }
    } catch (err) {
      console.warn('Could not fetch company applications:', err.message);
    } finally {
      setLoadingCompanyApps(false);
    }
  };

  // Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      location: user?.location || '',
      type: 'Full-time',
      experienceLevel: 'Mid Level'
    });
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  // Submit Create Job
  const handleCreateJob = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.title || !formData.description || !formData.location) {
      setModalError('Please fill in all required fields (title, description, location).');
      return;
    }

    try {
      setModalSubmitting(true);
      const res = await jobService.createJob(formData);
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchMyJobs();
        fetchDashboardData();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create job posting.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location,
      type: job.type,
      experienceLevel: job.experienceLevel
    });
    setModalError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Job
  const handleEditJob = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.title || !formData.description || !formData.location) {
      setModalError('Please fill in all required fields.');
      return;
    }

    try {
      setModalSubmitting(true);
      const res = await jobService.updateJob(selectedJob._id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchMyJobs();
        fetchDashboardData();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update job posting.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Toggle Job Status (Close / Activate)
  const handleToggleJobStatus = async (job) => {
    try {
      if (job.isActive) {
        await jobService.closeJob(job._id);
      } else {
        await jobService.activateJob(job._id);
      }
      fetchMyJobs();
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job requisition status.');
    }
  };

  // Open View Details Modal
  const openViewModal = (job) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  // Open Applications Modal for a specific job
  const openApplicationsModal = async (job) => {
    setSelectedJob(job);
    setIsApplicationsModalOpen(true);
    setLoadingApps(true);
    try {
      const res = await jobService.getJobApplications(job._id);
      if (res.success) {
        setJobApplications(res.applications || []);
      }
    } catch (err) {
      console.warn('Could not fetch applications:', err.message);
      setJobApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  // Open review modal from notification or application card
  const handleOpenReviewModal = async (application) => {
    setSelectedReviewApp(application);
    setReviewNotes(application.notes || '');
    setStatusUpdateMessage(null);
    setStatusUpdateError(null);
    setIsNotifDropdownOpen(false);
    setIsApplicationsModalOpen(false);
  };

  // Click on notification to review application
  const handleReviewFromNotification = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      }

      if (notif.applicationId) {
        const appId = typeof notif.applicationId === 'object' ? notif.applicationId._id : notif.applicationId;
        const res = await applicationService.getApplicationById(appId);
        if (res.success && res.application) {
          handleOpenReviewModal(res.application);
        }
      }
    } catch (err) {
      console.error('Failed to open application from notification:', err);
    }
  };

  // UPDATE APPLICATION STATUS (Activity Diagram Join: Update Application Status)
  const handleUpdateApplicationStatus = async (newStatus) => {
    if (!selectedReviewApp) return;

    try {
      setUpdatingStatus(true);
      setStatusUpdateError(null);
      setStatusUpdateMessage(null);

      const res = await applicationService.updateApplicationStatus(selectedReviewApp._id, {
        status: newStatus,
        notes: reviewNotes
      });

      if (res.success && res.application) {
        setSelectedReviewApp(res.application);
        setStatusUpdateMessage(`Candidate status transitioned to "${newStatus}"!`);

        // Refresh lists
        fetchCompanyApplications();
        if (selectedJob) {
          fetchMyJobs();
        }
        fetchNotifications();
        fetchDashboardData();
      }
    } catch (err) {
      setStatusUpdateError(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Download candidate resume
  const handleDownloadResume = async (resume) => {
    if (!resume) return;
    try {
      await resumeService.downloadResume(resume._id, resume.fileName);
    } catch (err) {
      console.error('Resume download failed:', err);
    }
  };

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? job.isActive
        : !job.isActive;

    return matchesSearch && matchesStatus;
  });

  // Filtered applications
  const filteredApplications = companyApplications.filter((app) => {
    const matchesStatus =
      appStatusFilter === 'All' ? true : app.status === appStatusFilter;

    const applicantName = app.applicantId?.name || '';
    const jobTitle = app.jobId?.title || '';
    const matchesSearch =
      applicantName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      jobTitle.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      (app.applicationId || '').toLowerCase().includes(appSearchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const activeCount = jobs.filter((j) => j.isActive).length;
  const closedCount = jobs.filter((j) => !j.isActive).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Shortlisted':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Hired':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Withdrawn':
        return 'bg-slate-700 text-slate-400 border-slate-600';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 pb-16">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Company / Recruiter Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {user?.name || 'Company Portal'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Organization ID: <span className="font-mono text-indigo-300 font-semibold">{user?.companyId || user?.id}</span> • {user?.industry} • {user?.location}
              </p>
            </div>

            {/* Notification Bell & Create Job CTA */}
            <div className="flex items-center gap-3 relative">
              {/* NOTIFICATION BELL (Step 9) */}
              <div className="relative">
                <button
                  id="recruiter-notification-bell-btn"
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 relative transition-all cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATIONS DROPDOWN */}
                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                    <div className="p-3.5 border-b border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadNotifCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllNotifsRead}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/60 text-xs">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-3.5 space-y-1.5 transition-colors ${
                              !n.isRead ? 'bg-indigo-950/30' : 'hover:bg-slate-750'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-300 flex items-center gap-1">
                                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />}
                                {n.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.applicationDate || n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <p className="text-slate-300 text-xs font-medium">
                              <strong>{n.applicantName || 'Applicant'}</strong> applied for <strong>{n.jobTitle || 'Job'}</strong>
                            </p>

                            <div className="flex items-center justify-between pt-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300">
                                Status: {n.applicationStatus || 'Applied'}
                              </span>

                              <button
                                onClick={() => handleReviewFromNotification(n)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Review</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Create Job Button */}
              <button
                id="open-create-job-modal-btn"
                onClick={openCreateModal}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Job Posting</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Activity Diagram Workflow Progress Banner (Step 9 Fork & Join) */}
        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Activity Diagram Swimlane: Application Processing & Join
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
              Step 9: Fork & Join Application Processing
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ Postings Managed
            </span>
            <span className="text-slate-500">➔</span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ Fork: DB Stored & Recruiter Notified
            </span>
            <span className="text-slate-500">➔</span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/30">
              ⚡ Join: Review & Update Application Status
            </span>
          </div>
        </div>

        {/* Real MongoDB Aggregated Recruiter Statistics (Step 15) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Real-time Recruitment Metrics (MongoDB)</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Live database counts across company requisitions
            </span>
          </div>

          {/* 8 Statistics Cards in Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* 1. Total Job Postings */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-indigo-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">Total Postings</span>
                <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-white">{dashboardStats.totalJobPostings}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">All company jobs</p>
            </div>

            {/* 2. Active Jobs */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">Active Jobs</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{dashboardStats.activeJobs}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Open requisitions</p>
            </div>

            {/* 3. Closed Jobs */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">Closed Jobs</span>
                <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-amber-400">{dashboardStats.closedJobs}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Filled or archived</p>
            </div>

            {/* 4. Total Applications */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-blue-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">Total Apps</span>
                <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-blue-400">{dashboardStats.totalApplications}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">All candidate apps</p>
            </div>

            {/* 5. New Applications (Applied) */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">New Applied</span>
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-purple-400">{dashboardStats.newApplications}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Pending review</p>
            </div>

            {/* 6. Shortlisted */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">Shortlisted</span>
                <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-cyan-400">{dashboardStats.shortlisted}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Screening stage</p>
            </div>

            {/* 7. Rejected */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-rose-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">Rejected</span>
                <UserX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-rose-400">{dashboardStats.rejected}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Not selected</p>
            </div>

            {/* 8. Hired */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold truncate">Hired</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{dashboardStats.hired}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Offers accepted</p>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION: Overview vs Job Postings vs Received Applications */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'jobs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Requisitions ({dashboardStats.totalJobPostings || jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Received Applications ({dashboardStats.totalApplications || companyApplications.length})</span>
          </button>
        </div>

        {/* TAB 0: DASHBOARD OVERVIEW (Step 15: Recent Applications, Recent Jobs, Recent Notifications) */}
        {activeTab === 'overview' && (
          <section className="space-y-8 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent Applications & Recent Job Postings (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Applications Section */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-white">Recent Applications</h3>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                        {recentApplications.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('applications')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View All Applications</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingDashboard ? (
                    <div className="py-8 flex justify-center items-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading recent applications...</span>
                    </div>
                  ) : recentApplications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">No applications received yet.</p>
                      <p className="text-[11px] text-slate-500">
                        When candidates apply to your job postings, they will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentApplications.map((app) => (
                        <div
                          key={app._id}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                {app.applicationId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                                  app.status
                                )}`}
                              >
                                {app.status}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {app.applicantId?.name || 'Candidate'}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate">
                                applied for <strong className="text-indigo-300">{app.jobId?.title}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span>{app.applicantId?.email}</span>
                              {app.resumeId?.fileName && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <FileText className="w-3 h-3 text-indigo-400" />
                                  {app.resumeId.fileName}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <Link
                              to={`/recruiter/applications/${app._id}`}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Details</span>
                            </Link>
                            <button
                              onClick={() => handleOpenReviewModal(app)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Review</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Job Postings Section */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-white">Recent Job Postings</h3>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                        {recentJobs.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Manage All Jobs</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingDashboard ? (
                    <div className="py-8 flex justify-center items-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading job postings...</span>
                    </div>
                  ) : recentJobs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">No job requisitions created yet.</p>
                      <button
                        onClick={openCreateModal}
                        className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Create First Job
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentJobs.map((job) => (
                        <div
                          key={job._id}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                {job.jobId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  job.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                                }`}
                              >
                                {job.isActive ? 'Active' : 'Closed'}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Posted {new Date(job.postedDate || job.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white truncate">{job.title}</h4>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                              <span>•</span>
                              <span>{job.type}</span>
                              <span>•</span>
                              <span>{job.experienceLevel}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                              onClick={() => openApplicationsModal(job)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Users className="w-3 h-3" />
                              <span>Submissions</span>
                            </button>
                            <button
                              onClick={() => openEditModal(job)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleJobStatus(job)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                job.isActive
                                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                              }`}
                              title={job.isActive ? 'Close job' : 'Reactivate job'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Recent Notifications & Quick Actions (1 col) */}
              <div className="space-y-6">
                {/* Recent Notifications / Activity Stream */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-white">Recent Activity</h3>
                    </div>
                    {unreadNotifCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                        {unreadNotifCount} new
                      </span>
                    )}
                  </div>

                  {recentNotifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">No recent notifications.</p>
                      <p className="text-[11px] text-slate-500">
                        Activity events will trigger when candidates apply.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recentNotifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => handleReviewFromNotification(notif)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            !notif.isRead
                              ? 'bg-indigo-950/40 border-indigo-500/30 hover:bg-indigo-950/60'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {!notif.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                )}
                                <h5 className="text-xs font-bold text-white line-clamp-1">{notif.title}</h5>
                              </div>
                              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                            <span className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                              Review <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Recruitment Shortcuts */}
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-800/80 border border-indigo-500/20 rounded-2xl p-5 shadow-lg space-y-4">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Recruiter Actions
                  </h4>

                  <div className="space-y-2">
                    <button
                      onClick={openCreateModal}
                      className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create New Job Posting</span>
                    </button>

                    <Link
                      to="/recruiter/applications"
                      className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all"
                    >
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>Application Pipeline View</span>
                    </Link>

                    <Link
                      to="/jobs"
                      className="w-full px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium border border-slate-800 flex items-center justify-center gap-2 transition-all"
                    >
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span>Explore Public Job Board</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 1: JOB POSTINGS */}
        {activeTab === 'jobs' && (
          <section className="space-y-6">
            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search jobs by title, location, or JOB-ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                {['All', 'Active', 'Closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      statusFilter === status
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs List */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading job postings...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-16 text-center bg-slate-800/40 rounded-2xl border border-slate-800 p-8 space-y-3">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No job postings found</p>
                <p className="text-xs text-slate-500">Create your first job posting to start receiving applications.</p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Create Job Posting
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredJobs.map((job) => (
                  <div
                    key={job._id}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md hover:border-slate-600 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {job.jobId}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            job.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-400 border border-slate-600'
                          }`}
                        >
                          {job.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white line-clamp-1">{job.title}</h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <span>•</span>
                        <span>{job.type}</span>
                        <span>•</span>
                        <span>{job.experienceLevel}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                      <button
                        onClick={() => openApplicationsModal(job)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>View Submissions</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openViewModal(job)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                          title="View requisition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                          title="Edit requisition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleJobStatus(job)}
                          className={`p-1.5 rounded-lg ${
                            job.isActive
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                          }`}
                          title={job.isActive ? 'Close requisition' : 'Reactivate requisition'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: RECEIVED APPLICATIONS (Step 9 Join & Step 10) */}
        {activeTab === 'applications' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Received Applications</h3>
                <p className="text-xs text-slate-400">Review candidate submissions across all your company jobs</p>
              </div>
              <Link
                to="/recruiter/applications"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Full Applications Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate name, job title, or APP-ID..."
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                {APPLICATION_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setAppStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      appStatusFilter === status
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications List */}
            {loadingCompanyApps ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading received applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-16 text-center bg-slate-800/40 rounded-2xl border border-slate-800 p-8 space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No applications found</p>
                <p className="text-xs text-slate-500">
                  Candidate applications submitted for your job postings will appear here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app._id}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {app.applicationId}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Submitted on {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-white">
                          {app.applicantId?.name || 'Applicant'}
                        </h4>
                        <span className="text-xs text-slate-400 font-normal">
                          applied for <strong className="text-indigo-300">{app.jobId?.title}</strong>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>Email: {app.applicantId?.email}</span>
                        {app.applicantId?.phone && <span>Phone: {app.applicantId.phone}</span>}
                        {app.resumeId && (
                          <span className="flex items-center gap-1 text-indigo-400">
                            <FileText className="w-3 h-3" />
                            {app.resumeId.fileName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Link
                        to={`/recruiter/applications/${app._id}`}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Detail Page</span>
                      </Link>
                      <button
                        onClick={() => handleOpenReviewModal(app)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick Review</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* APPLICATION REVIEW MODAL (Step 9 Join: Update Application Status) */}
      {selectedReviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {selectedReviewApp.applicationId}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                      selectedReviewApp.status
                    )}`}
                  >
                    {selectedReviewApp.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedReviewApp.applicantId?.name || 'Applicant'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Applied for <strong>{selectedReviewApp.jobId?.title}</strong> on{' '}
                  {new Date(selectedReviewApp.appliedDate || selectedReviewApp.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedReviewApp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Details & Resume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700/80 space-y-2">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Candidate Profile
                </p>
                <div className="space-y-1 text-slate-300">
                  <p><strong>Email:</strong> {selectedReviewApp.applicantId?.email}</p>
                  <p><strong>Phone:</strong> {selectedReviewApp.applicantId?.phone || 'Not provided'}</p>
                  <p><strong>Location:</strong> {selectedReviewApp.applicantId?.location || 'Not specified'}</p>
                  {selectedReviewApp.applicantId?.skills && (
                    <p><strong>Skills:</strong> {selectedReviewApp.applicantId.skills}</p>
                  )}
                </div>
              </div>

              {selectedReviewApp.resumeId && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Attached Resume
                    </p>
                    <p className="font-bold text-white text-xs mt-1 truncate">
                      {selectedReviewApp.resumeId.fileName}
                    </p>
                    <p className="text-[10px] text-slate-500">Verified format: PDF/DOCX</p>
                  </div>
                  <button
                    onClick={() => handleDownloadResume(selectedReviewApp.resumeId)}
                    className="mt-3 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Candidate Resume</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Submitted Cover Letter
              </h4>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {selectedReviewApp.coverLetter || 'No cover letter provided by candidate.'}
              </div>
            </div>

            {/* Applicant Submission Notes */}
            {selectedReviewApp.notes && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Candidate Notes
                </h4>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs text-slate-400">
                  {selectedReviewApp.notes}
                </div>
              </div>
            )}

            {/* STATUS UPDATE / DECISION CONTROLS (Step 9 Activity Diagram Join) */}
            <div className="p-5 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Review Decision & Update Status (Step 9 Join)
                </span>
                <span className="text-[11px] text-slate-400">
                  Current Status: <strong className="text-white">{selectedReviewApp.status}</strong>
                </span>
              </div>

              {statusUpdateMessage && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{statusUpdateMessage}</span>
                </div>
              )}

              {statusUpdateError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{statusUpdateError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">
                  Evaluation / Interview Notes for this Candidate:
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g., Passed technical screen. Proceed to interview or reasons for rejection..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Transition Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {selectedReviewApp.status === 'Applied' && (
                  <>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateApplicationStatus('Shortlisted')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Shortlist Candidate</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateApplicationStatus('Rejected')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                  </>
                )}

                {selectedReviewApp.status === 'Shortlisted' && (
                  <>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateApplicationStatus('Hired')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Hire Candidate</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateApplicationStatus('Rejected')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                  </>
                )}

                {(selectedReviewApp.status === 'Hired' || selectedReviewApp.status === 'Rejected') && (
                  <span className="text-xs text-slate-400 italic">
                    This application has reached a final outcome: <strong>{selectedReviewApp.status}</strong>.
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-700">
              <button
                onClick={() => setSelectedReviewApp(null)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">Create New Job Requisition</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Job Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Job Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {JOB_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Experience Level <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description & Requirements <span className="text-rose-400">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Outline key responsibilities and qualifications..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {modalSubmitting ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT JOB MODAL */}
      {isEditModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">Edit Job Requisition</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Job Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {JOB_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience Level</label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {selectedJob.jobId}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedJob.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Posted on {new Date(selectedJob.postedDate || selectedJob.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-200 font-medium">
                {selectedJob.type}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                {selectedJob.experienceLevel}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedJob.location}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-medium ${
                  selectedJob.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}
              >
                {selectedJob.isActive ? 'Active Requisition' : 'Closed Requisition'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider">
                Full Description
              </h4>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-sans">
                {selectedJob.description}
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-700">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOB SPECIFIC APPLICATIONS MODAL */}
      {isApplicationsModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <h3 className="text-base font-bold text-white">
                  Applications for: {selectedJob.title}
                </h3>
                <span className="font-mono text-xs text-indigo-400">{selectedJob.jobId}</span>
              </div>
              <button
                onClick={() => setIsApplicationsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingApps ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-xs">Fetching candidate submissions...</p>
              </div>
            ) : jobApplications.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-700 rounded-xl p-6 space-y-2">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-white">No applications received yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Once candidates apply for this job posting with their resume, their submissions will appear here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobApplications.map((app) => (
                  <div
                    key={app._id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-xs flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-white">{app.applicantId?.name || 'Applicant'}</p>
                      <p className="text-slate-400">{app.applicantId?.email}</p>
                      <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(app.status)}`}>
                        Status: {app.status}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenReviewModal(app)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-slate-700">
              <button
                onClick={() => setIsApplicationsModalOpen(false)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
