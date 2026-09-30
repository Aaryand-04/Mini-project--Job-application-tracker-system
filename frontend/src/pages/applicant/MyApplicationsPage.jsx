import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../../services/applicationService';
import { resumeService } from '../../services/resumeService';
import { StatusBadge } from '../../utils/statusBadges';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  Download,
  X,
  Eye
} from 'lucide-react';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Application for Detail Modal
  const [activeApp, setActiveApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationService.getMyApplications({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: searchQuery ? searchQuery.trim() : undefined
      });
      if (res.success) {
        setApplications(res.applications || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleDownloadResume = async (resume) => {
    if (!resume) return;
    try {
      await resumeService.downloadResume(resume._id, resume.fileName);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = app.jobId?.title?.toLowerCase() || '';
    const company = app.jobId?.companyId?.name?.toLowerCase() || '';
    const appId = app.applicationId?.toLowerCase() || '';
    return title.includes(query) || company.includes(query) || appId.includes(query);
  });

  const statuses = ['All', 'Applied', 'Shortlisted', 'Hired', 'Rejected'];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-20">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Step 12 • Application Tracking
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              My Job Applications
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track live status updates, review submission histories, and inspect recruiter review timelines.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors self-start sm:self-auto"
          >
            <span>Browse More Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search by job title, company, or application ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {statuses.map((status) => {
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading your job applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {statusFilter !== 'All' ? `No ${statusFilter} applications` : 'No applications submitted yet'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {statusFilter !== 'All'
                ? `You do not have any applications currently marked as "${statusFilter}".`
                : 'Explore open job postings from verified companies and submit your application with your saved resume.'}
            </p>
            {statusFilter !== 'All' ? (
              <button
                onClick={() => setStatusFilter('All')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear Filter
              </button>
            ) : (
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <span>Search Open Jobs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const job = app.jobId;
              const resume = app.resumeId;

              return (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Requisition & Status Details */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {app.applicationId}
                        </span>
                        <StatusBadge status={app.status} />
                        <span className="text-[11px] text-slate-400">
                          Applied on {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {job?.title || 'Job Title Unavailable'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{job?.companyId?.name || 'Company'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job?.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job?.type || 'Full-time'}</span>
                        </div>
                      </div>

                      {resume && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Resume: <strong className="text-slate-700">{resume.fileName}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      <Link
                        to={`/applications/${app._id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <span>View Status Timeline</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => setActiveApp(app)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Quick Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick View</span>
                      </button>

                      {job && (
                        <Link
                          to={`/jobs/${job._id}`}
                          className="px-3 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-blue-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <span>Job Posting</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Submission summary previews */}
                  {(app.coverLetter || app.notes) && (
                    <div className="border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {app.coverLetter && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-600 block text-[11px] mb-1">Cover Letter Snippet:</span>
                          <p className="text-slate-600 line-clamp-2 italic">"{app.coverLetter}"</p>
                        </div>
                      )}
                      {app.notes && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-600 block text-[11px] mb-1">Applicant Notes:</span>
                          <p className="text-slate-600 line-clamp-2">{app.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* APPLICATION DETAILS MODAL */}
      {activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {activeApp.applicationId}
                  </span>
                  <StatusBadge status={activeApp.status} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {activeApp.jobId?.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeApp.jobId?.companyId?.name} • Applied on{' '}
                  {new Date(activeApp.appliedDate || activeApp.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setActiveApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resume Details */}
            {activeApp.resumeId && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{activeApp.resumeId.fileName}</p>
                    <p className="text-[10px] text-slate-400">Attached Resume</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadResume(activeApp.resumeId)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  title="Download Resume"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cover Letter */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Submitted Cover Letter
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {activeApp.coverLetter || 'No cover letter provided.'}
              </div>
            </div>

            {/* Notes */}
            {activeApp.notes && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Submission Notes
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600">
                  {activeApp.notes}
                </div>
              </div>
            )}

            {/* Workflow Swimlane Info */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Application Tracking Status</span>
              </p>
              <p className="text-[11px] text-slate-500">
                The hiring team reviews applications. When your status is updated (Shortlisted, Hired, etc.), notifications and status changes will reflect here in real-time.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveApp(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
