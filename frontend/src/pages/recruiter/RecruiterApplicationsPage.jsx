import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Download,
  Eye,
  Filter,
  Calendar,
  User,
  Mail,
  Building2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import recruiterApplicationService from '../../services/recruiterApplicationService';
import { jobService } from '../../services/jobService';
import { StatusBadge } from '../../utils/statusBadges';

export default function RecruiterApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') || 'All');

  const statusTabs = ['All', 'Applied', 'Shortlisted', 'Hired', 'Rejected'];

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedJobId !== 'All') params.jobId = selectedJobId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await recruiterApplicationService.getRecruiterApplications(params);
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await jobService.getMyJobs();
      setJobs(res.jobs || []);
    } catch (err) {
      console.error('Failed to load company jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedStatus, selectedJobId, searchQuery]);

  // Sync with URL query parameters
  useEffect(() => {
    const nextParams = {};
    if (selectedStatus !== 'All') nextParams.status = selectedStatus;
    if (selectedJobId !== 'All') nextParams.jobId = selectedJobId;
    if (searchQuery.trim()) nextParams.search = searchQuery.trim();
    setSearchParams(nextParams, { replace: true });
  }, [selectedStatus, selectedJobId, searchQuery]);

  const handleDownloadResume = async (e, app) => {
    e.stopPropagation();
    try {
      setDownloadingId(app._id);
      const fileName = app.resumeId?.fileName || `${app.applicantId?.name || 'Applicant'}_Resume.pdf`;
      await recruiterApplicationService.downloadApplicationResume(app._id, fileName);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download resume. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Applied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            Applied
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Shortlisted
          </span>
        );
      case 'Hired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hired
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Metrics counters
  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => a.status === 'Applied').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const hiredCount = applications.filter((a) => a.status === 'Hired').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
              <Link to="/recruiter/dashboard" className="hover:text-indigo-400 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-200">Received Applications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <User className="w-7 h-7 text-indigo-400" />
              Applicant Tracking System
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Review received candidate applications across your company job postings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchApplications}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/recruiter/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Company Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Metrics Overview Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-400">Total Filtered</span>
            <div className="mt-1 text-2xl font-bold text-white">{totalCount}</div>
          </div>
          <div className="bg-slate-800/80 border border-blue-500/20 rounded-xl p-4">
            <span className="text-xs font-medium text-blue-400">New / Applied</span>
            <div className="mt-1 text-2xl font-bold text-blue-300">{appliedCount}</div>
          </div>
          <div className="bg-slate-800/80 border border-amber-500/20 rounded-xl p-4">
            <span className="text-xs font-medium text-amber-400">Shortlisted</span>
            <div className="mt-1 text-2xl font-bold text-amber-300">{shortlistedCount}</div>
          </div>
          <div className="bg-slate-800/80 border border-emerald-500/20 rounded-xl p-4">
            <span className="text-xs font-medium text-emerald-400">Hired</span>
            <div className="mt-1 text-2xl font-bold text-emerald-300">{hiredCount}</div>
          </div>
          <div className="bg-slate-800/80 border border-rose-500/20 rounded-xl p-4 col-span-2 sm:col-span-1">
            <span className="text-xs font-medium text-rose-400">Rejected</span>
            <div className="mt-1 text-2xl font-bold text-rose-300">{rejectedCount}</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, email, or position..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/90 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Job Posting Selector */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-900/90 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Job Postings</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} ({j.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-700/60 pt-3">
            {statusTabs.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List / Table */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading received applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No applications found</h3>
              <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedStatus !== 'All' || selectedJobId !== 'All'
                  ? 'No applications match your active filter criteria. Try resetting filters.'
                  : 'Your job postings have not received any applications yet.'}
              </p>
              {(searchQuery || selectedStatus !== 'All' || selectedJobId !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('All');
                    setSelectedJobId('All');
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
                <thead className="bg-slate-900/70 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Applicant
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Job Applied
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Applied Date
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Resume
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-slate-800/40">
                  {applications.map((app) => (
                    <tr
                      key={app._id}
                      className="hover:bg-slate-700/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/recruiter/applications/${app._id}`;
                      }}
                    >
                      {/* Applicant Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0">
                            {app.applicantId?.name
                              ? app.applicantId.name.charAt(0).toUpperCase()
                              : 'A'}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {app.applicantId?.name || 'Applicant'}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{app.applicantId?.email}</span>
                            </div>
                            {(() => {
                              const skills = Array.isArray(app.applicantId?.skills)
                                ? app.applicantId.skills
                                : typeof app.applicantId?.skills === 'string'
                                ? app.applicantId.skills.split(',').map(s => s.trim()).filter(Boolean)
                                : [];
                              return skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {skills.slice(0, 3).map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 text-[10px] bg-slate-700/80 text-slate-300 rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {skills.length > 3 && (
                                    <span className="text-[10px] text-slate-500">
                                      +{skills.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* Job Applied Column */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">
                          {app.jobId?.title || 'Job Title'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
                            {app.jobId?.type || 'Full-time'}
                          </span>
                          <span>{app.jobId?.location}</span>
                        </div>
                      </td>

                      {/* Applied Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(app.appliedDate || app.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {app.applicationId}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>

                      {/* Resume Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {app.resumeId ? (
                          <button
                            onClick={(e) => handleDownloadResume(e, app)}
                            disabled={downloadingId === app._id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 transition-colors"
                            title="Download applicant resume"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>
                              {downloadingId === app._id ? 'Downloading...' : 'Resume'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-500 italic text-xs">No resume</span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <Link
                          to={`/recruiter/applications/${app._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
