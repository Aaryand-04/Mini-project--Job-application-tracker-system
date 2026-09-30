import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Building2,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Send
} from 'lucide-react';
import recruiterApplicationService from '../../services/recruiterApplicationService';
import { StatusBadge } from '../../utils/statusBadges';

export default function RecruiterApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [evalNotes, setEvalNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await recruiterApplicationService.getRecruiterApplicationById(id);
      setApplication(res.application);
      setSelectedStatus(res.application.status);
      setEvalNotes(res.application.notes || '');
    } catch (err) {
      console.error('Failed to fetch application:', err);
      if (err.response?.status === 403) {
        setError('Forbidden: You do not have permission to view applications belonging to another company.');
      } else if (err.response?.status === 404) {
        setError('Application not found.');
      } else {
        setError('An error occurred while loading this application.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleDownloadResume = async () => {
    if (!application?.resumeId) return;
    try {
      setDownloading(true);
      const fileName =
        application.resumeId.fileName ||
        `${application.applicantId?.name || 'Applicant'}_Resume.pdf`;
      await recruiterApplicationService.downloadApplicationResume(application._id, fileName);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download resume. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewResume = async () => {
    if (!application?.resumeId) return;
    try {
      setViewing(true);
      await recruiterApplicationService.viewApplicationResume(application._id);
    } catch (err) {
      console.error('Resume preview failed:', err);
      alert('Failed to open resume preview. You can still download the file.');
    } finally {
      setViewing(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      setActionSuccess('');
      setActionError('');

      const res = await recruiterApplicationService.updateApplicationStatus(application._id, {
        status: newStatus,
        notes: evalNotes.trim()
      });

      setApplication(res.application);
      setSelectedStatus(res.application.status);
      setActionSuccess(`Application status successfully updated to "${newStatus}". The candidate has been notified.`);
    } catch (err) {
      console.error('Status update failed:', err);
      setActionError(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setUpdating(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Applied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Applied (New Submission)
          </span>
        );
      case 'Shortlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Shortlisted
          </span>
        );
      case 'Hired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hired
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <div className="pt-2">
            <Link
              to="/recruiter/applications"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Received Applications</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const applicant = application.applicantId || {};
  const job = application.jobId || {};
  const resume = application.resumeId || {};

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navigation & Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/recruiter/applications"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Back to applications list"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="text-xs font-mono text-indigo-400">
                {application.applicationId}
              </div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>{applicant.name || 'Candidate Review'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(application.status)}
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Applied {new Date(application.appliedDate || application.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Feedback Alerts */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Candidate Details Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Applicant Profile Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white text-2xl shadow-md flex-shrink-0">
                  {applicant.name ? applicant.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white truncate">
                      {applicant.name || 'Anonymous Applicant'}
                    </h2>
                  </div>

                  {/* Contact Info Pills */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <a
                      href={`mailto:${applicant.email}`}
                      className="flex items-center gap-2 text-slate-300 hover:text-indigo-300 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{applicant.email || 'No email provided'}</span>
                    </a>
                    {applicant.phone && (
                      <a
                        href={`tel:${applicant.phone}`}
                        className="flex items-center gap-2 text-slate-300 hover:text-indigo-300 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span>{applicant.phone}</span>
                      </a>
                    )}
                    {applicant.location && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span>{applicant.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills tags */}
                  {(() => {
                    const skillsList = Array.isArray(applicant.skills)
                      ? applicant.skills
                      : typeof applicant.skills === 'string'
                      ? applicant.skills.split(',').map(s => s.trim()).filter(Boolean)
                      : [];
                    return skillsList.length > 0 ? (
                      <div className="mt-4 pt-3 border-t border-slate-700/60">
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                          Applicant Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {skillsList.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 text-xs font-medium bg-slate-700/90 text-indigo-200 border border-slate-600/80 rounded-lg"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>

            {/* 2. Resume Document Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Submitted Resume</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secure Document</span>
                </div>
              </div>

              {resume && resume.fileName ? (
                <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate text-sm">
                        {resume.fileName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatFileSize(resume.fileSize)} &bull; Uploaded{' '}
                        {new Date(resume.uploadedAt || application.appliedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleViewResume}
                      disabled={viewing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-600 rounded-lg border border-indigo-500/30 transition-colors"
                      title="Open resume in new tab"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{viewing ? 'Opening...' : 'View'}</span>
                    </button>
                    <button
                      onClick={handleDownloadResume}
                      disabled={downloading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
                      title="Download resume file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloading ? 'Downloading...' : 'Download'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No resume attachment found for this application.
                </div>
              )}
            </div>

            {/* 3. Cover Letter Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Cover Letter</h3>
              </div>

              {application.coverLetter ? (
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                  {application.coverLetter}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm italic">
                  No cover letter submitted with this application.
                </div>
              )}
            </div>

            {/* 4. Candidate Submission Notes Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Candidate Submission Notes</span>
              </h3>

              {application.notes ? (
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-line">
                  {application.notes}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm italic">
                  No applicant notes provided.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Job Info & Decision Panel (1/3 width) */}
          <div className="space-y-6">
            {/* 1. Job Information Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Target Position</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-lg font-bold text-white">{job.title || 'Job Title'}</div>
                  <div className="text-xs text-indigo-300 font-mono mt-0.5">
                    Job ID: {job.jobId}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400">Type</span>
                    <div className="font-semibold text-white mt-0.5">{job.type || 'Full-time'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Level</span>
                    <div className="font-semibold text-white mt-0.5">
                      {job.experienceLevel || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Location</span>
                    <div className="font-semibold text-white mt-0.5">{job.location || 'Remote'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Posted</span>
                    <div className="font-semibold text-white mt-0.5">
                      {new Date(job.postedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {job._id && (
                  <div className="pt-2">
                    <Link
                      to={`/jobs/${job._id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>View public job listing</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Application Decision & Status Update Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Review & Decision</h3>
              </div>

              <div className="text-xs text-slate-400">
                Update the application status and record internal evaluation notes. Changes are logged and the applicant will receive an automated status update.
              </div>

              {/* Status Action Buttons following the Activity Diagram State Machine */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Available Recruiter Actions:</span>

                {application.status === 'Applied' && (
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate('Shortlisted')}
                      disabled={updating}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Shortlist Candidate</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
                        Move to Round 1
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusUpdate('Rejected')}
                      disabled={updating}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Reject Application</span>
                      </div>
                      <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded text-rose-200">
                        Disqualify
                      </span>
                    </button>
                  </div>
                )}

                {application.status === 'Shortlisted' && (
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate('Hired')}
                      disabled={updating}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Hire Candidate</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
                        Extend Offer
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusUpdate('Rejected')}
                      disabled={updating}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Reject Application</span>
                      </div>
                      <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded text-rose-200">
                        Disqualify
                      </span>
                    </button>
                  </div>
                )}

                {(application.status === 'Hired' || application.status === 'Rejected') && (
                  <div className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-1 text-center">
                    <span className="text-xs font-bold text-slate-300 block">
                      Application Decision Finalized
                    </span>
                    <p className="text-[11px] text-slate-400">
                      This application has reached a terminal outcome (
                      <strong className={application.status === 'Hired' ? 'text-emerald-400' : 'text-rose-400'}>
                        {application.status}
                      </strong>
                      ). No further status updates can be made.
                    </p>
                  </div>
                )}
              </div>

              {/* Evaluation Notes Field */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Internal Recruiter Evaluation Notes:
                </label>
                <textarea
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  rows={3}
                  placeholder="Add interview feedback, technical ratings, or evaluation notes..."
                  className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Save notes button */}
              <button
                type="button"
                onClick={() => handleStatusUpdate(application.status)}
                disabled={updating}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Notes & Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
