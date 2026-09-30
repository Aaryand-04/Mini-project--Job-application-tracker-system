import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationService } from '../../services/applicationService';
import { resumeService } from '../../services/resumeService';
import { StatusBadge } from '../../utils/statusBadges';
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Lock,
  MessageSquare
} from 'lucide-react';

export default function ApplicantApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationService.getApplicationById(id);
      if (res.success) {
        setApplication(res.application);
      } else {
        setError(res.message || 'Failed to load application.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Forbidden: You do not have permission to view another applicant’s application.');
      } else if (err.response?.status === 404) {
        setError('Application not found.');
      } else {
        setError(err.response?.data?.message || 'Failed to load application details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!application?.resumeId) return;
    try {
      setDownloading(true);
      await resumeService.downloadResume(application.resumeId._id, application.resumeId.fileName);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download resume.');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewResume = async () => {
    if (!application?.resumeId) return;
    try {
      await resumeService.viewResume(application.resumeId._id);
    } catch (err) {
      console.error('Preview failed:', err);
      alert('Failed to preview resume.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTimelineStepIcon = (status) => {
    switch (status) {
      case 'Applied':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Shortlisted':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'Hired':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTimelineStepBg = (status) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Shortlisted':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Hired':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'Rejected':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getTimelineStepDescription = (status, notes) => {
    if (notes && notes.trim()) return notes;
    switch (status) {
      case 'Applied':
        return 'Your application was submitted successfully and received by the employer.';
      case 'Shortlisted':
        return 'Congratulations! Your profile has been reviewed and shortlisted for the next stage.';
      case 'Hired':
        return 'Congratulations! You have been hired for this position. Welcome aboard!';
      case 'Rejected':
        return 'Thank you for your interest. The employer has chosen to move forward with other candidates.';
      default:
        return `Application status updated to ${status}.`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <div className="pt-2">
            <Link
              to="/applications"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Applications</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const job = application.jobId || {};
  const company = job.companyId || {};
  const resume = application.resumeId || {};

  // Status timeline entries that actually occurred
  const timelineEvents = application.statusHistory && application.statusHistory.length > 0
    ? application.statusHistory
    : [
        {
          status: 'Applied',
          changedAt: application.appliedDate || application.createdAt,
          notes: 'Application submitted by candidate.'
        }
      ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-20">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/applications"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Back to My Applications"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/applications" className="hover:text-blue-600 transition-colors">
                My Applications
              </Link>
              <span>/</span>
              <span className="font-mono text-slate-700 font-bold">{application.applicationId}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={application.status} size="md" />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Main Application Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                  {application.applicationId}
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-500">
                  Submitted on{' '}
                  {new Date(application.appliedDate || application.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {job.title || 'Job Title'}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{company.name || 'Hiring Organization'}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.type && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                    {job.type}
                  </span>
                )}
                {job.experienceLevel && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                    {job.experienceLevel}
                  </span>
                )}
              </div>
            </div>

            {job._id && (
              <Link
                to={`/jobs/${job._id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors shadow-sm self-start"
              >
                <span>View Job Posting</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Status Timeline Section (Activity Diagram: View Application Status) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Application Status Progression</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chronological audit trail of recruiter evaluations and milestones.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 italic">
              {timelineEvents.length} state{timelineEvents.length === 1 ? '' : 's'} recorded
            </span>
          </div>

          {/* Timeline Visual Flow: Displays ONLY states that actually occurred */}
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {timelineEvents.map((event, index) => {
              const isLatest = index === timelineEvents.length - 1;
              const isInitial = index === 0;

              return (
                <div key={index} className="relative flex items-start gap-4 group">
                  {/* Timeline Node Bullet */}
                  <div
                    className={`absolute -left-6 sm:-left-8 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shadow-sm ${
                      isLatest
                        ? 'bg-white border-blue-600 ring-4 ring-blue-50'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {getTimelineStepIcon(event.status)}
                  </div>

                  {/* Event Details Card */}
                  <div className="flex-1 bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 sm:p-5 transition-all group-hover:border-slate-300 group-hover:bg-slate-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {event.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTimelineStepBg(
                            event.status
                          )}`}
                        >
                          Step {index + 1}
                        </span>
                        {isLatest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                            Current Status
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(event.changedAt || event.timestamp || application.appliedDate).toLocaleDateString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {getTimelineStepDescription(event.status, event.notes)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Read-Only Status Info Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Employer Controlled Evaluation:</strong> Application status transitions are exclusively authorized and updated by the hiring team at {company.name || 'the employer'}. You will automatically receive in-app notifications whenever an update occurs.
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Submitted Resume & Cover Letter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Submitted Resume Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Submitted Resume</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Document
              </span>
            </div>

            {resume && resume.fileName ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {resume.fileName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatFileSize(resume.fileSize)} &bull; Attached at submission
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                  <button
                    onClick={handleViewResume}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Resume</span>
                  </button>
                  <button
                    onClick={handleDownloadResume}
                    disabled={downloading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloading ? 'Downloading...' : 'Download'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No resume attached to this record.
              </div>
            )}
          </div>

          {/* Submission Notes Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Applicant Submission Notes</span>
            </h3>

            {application.notes ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 whitespace-pre-line leading-relaxed min-h-[5.5rem]">
                {application.notes}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No submission notes provided with this application.
              </div>
            )}
          </div>
        </div>

        {/* Cover Letter Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Cover Letter</span>
          </h3>

          {application.coverLetter ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed font-sans">
              {application.coverLetter}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              No cover letter submitted with this application.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
