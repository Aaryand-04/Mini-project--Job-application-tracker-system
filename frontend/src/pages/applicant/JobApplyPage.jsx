import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { resumeService } from '../../services/resumeService';
import { applicationService } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  Send,
  PlusCircle,
  X,
  FileCheck
} from 'lucide-react';

export default function JobApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isApplicant, isAuthenticated } = useAuth();

  // Job & Resumes Data
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  // Form State
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Existing application detection
  const [existingApplication, setExistingApplication] = useState(null);

  // Success State
  const [submittedApp, setSubmittedApp] = useState(null);

  // Inline Quick Resume Upload Modal/Section
  const [showInlineUpload, setShowInlineUpload] = useState(false);
  const [inlineFile, setInlineFile] = useState(null);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [inlineUploadError, setInlineUploadError] = useState(null);
  const inlineFileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError(null);

      // Fetch Job Details
      const jobRes = await jobService.getJobById(id);
      if (jobRes.success && jobRes.job) {
        setJob(jobRes.job);
      } else {
        setPageError('Job posting not found.');
        return;
      }

      // If user is applicant, load their resumes and check if already applied
      if (isAuthenticated && isApplicant) {
        const [resumeRes, myAppsRes] = await Promise.all([
          resumeService.getMyResumes(),
          applicationService.getMyApplications()
        ]);

        if (resumeRes.success) {
          const userResumes = resumeRes.resumes || [];
          setResumes(userResumes);
          const defaultRes = userResumes.find((r) => r.isDefault) || userResumes[0];
          if (defaultRes) {
            setSelectedResumeId(defaultRes._id);
          }
        }

        // Check if already applied
        if (myAppsRes.success && myAppsRes.applications) {
          const already = myAppsRes.applications.find(
            (app) => app.jobId?._id === jobRes.job._id || app.jobId === jobRes.job._id
          );
          if (already) {
            setExistingApplication(already);
          }
        }
      }
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to load application data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const fileName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!hasValidExt) {
        setInlineUploadError('Invalid format. Only PDF, DOC, and DOCX files are allowed.');
        setInlineFile(null);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setInlineUploadError('File exceeds 5MB limit.');
        setInlineFile(null);
        return;
      }

      setInlineUploadError(null);
      setInlineFile(file);
    }
  };

  const handleInlineUpload = async () => {
    if (!inlineFile) return;
    try {
      setInlineUploading(true);
      setInlineUploadError(null);
      const formData = new FormData();
      formData.append('resume', inlineFile);

      const res = await resumeService.uploadResume(formData);
      if (res.success && res.resume) {
        setResumes((prev) => [res.resume, ...prev]);
        setSelectedResumeId(res.resume._id);
        setShowInlineUpload(false);
        setInlineFile(null);
      }
    } catch (err) {
      setInlineUploadError(err.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setInlineUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedResumeId) {
      setSubmitError('Please select or upload a resume to proceed.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await applicationService.submitApplication({
        jobId: job._id,
        resumeId: selectedResumeId,
        coverLetter,
        notes
      });

      if (res.success && res.application) {
        setSubmittedApp(res.application);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setSubmitError('You have already applied for this job posting.');
        setExistingApplication({
          applicationId: err.response.data?.applicationId || 'Submitted',
          status: err.response.data?.status || 'Applied',
          appliedDate: err.response.data?.appliedDate || new Date()
        });
      } else {
        setSubmitError(err.response?.data?.message || 'Application submission failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Preparing application form...</p>
        </div>
      </div>
    );
  }

  if (pageError || !job) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Open Application</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{pageError}</p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>
    );
  }

  // SUCCESS VIEW: Application Submitted
  if (submittedApp) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 py-12 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              Application Submitted Successfully
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Thank You, {user?.name || 'Applicant'}!
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your application for <strong>{job.title}</strong> at <strong>{job.companyId?.name}</strong> has been saved and the hiring recruiter has been notified.
            </p>
          </div>

          {/* Submission Details Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 text-left space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-400 font-medium">Application ID</span>
              <span className="font-mono font-bold text-blue-600">{submittedApp.applicationId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-400 font-medium">Initial Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800">
                {submittedApp.status}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-400 font-medium">Resume Attached</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                {submittedApp.resumeId?.fileName || 'Primary Resume'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Applied Date</span>
              <span className="text-slate-700 font-medium">
                {new Date(submittedApp.appliedDate || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Activity Diagram Next Step */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 text-xs text-left flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold">
              ✓
            </div>
            <div>
              <p className="font-bold text-slate-900">Activity Diagram Workflow Progress</p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Application saved in database &rarr; Recruiter notified &rarr; Track review status in My Applications.
              </p>
            </div>
          </div>

          {/* Navigation CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              to="/applications"
              className="w-full sm:flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>View Application Status</span>
            </Link>
            <Link
              to="/jobs"
              className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Back to Job Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-20">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            to={`/jobs/${job._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Job Details</span>
          </Link>
          <span className="text-[11px] font-bold text-slate-400 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
            {job.jobId}
          </span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Job Requisition Overview Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{job.type}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Apply for {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{job.companyId?.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Level: {job.experienceLevel}</span>
                </div>
              </div>
            </div>

            <div className="self-start">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Position Open
              </span>
            </div>
          </div>
        </div>

        {/* Existing Application Banner (Duplicate Prevention) */}
        {existingApplication && (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  You Have Already Applied for this Position
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Application ID: <strong className="font-mono">{existingApplication.applicationId}</strong> • Status:{' '}
                  <strong>{existingApplication.status}</strong> • Submitted{' '}
                  {new Date(existingApplication.appliedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Link
              to="/applications"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto shadow-sm"
            >
              View Status
            </Link>
          </div>
        )}

        {/* Form Error Banner */}
        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{submitError}</span>
          </div>
        )}

        {/* Main Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Resume Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Select Resume <span className="text-rose-500">*</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose an existing resume from your portfolio or upload a new one.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInlineUpload(!showInlineUpload)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Upload New</span>
              </button>
            </div>

            {/* Inline Quick Uploader */}
            {showInlineUpload && (
              <div className="p-4 bg-slate-50 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-800">Quick Upload Resume</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineUpload(false);
                      setInlineFile(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div
                  onClick={() => inlineFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-white transition-colors"
                >
                  <input
                    ref={inlineFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleInlineFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1 text-xs">
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                    {inlineFile ? (
                      <span className="font-bold text-slate-900">{inlineFile.name}</span>
                    ) : (
                      <span className="text-slate-600">
                        Click to select PDF or DOCX file (Max 5MB)
                      </span>
                    )}
                  </div>
                </div>

                {inlineUploadError && (
                  <p className="text-xs text-rose-600">{inlineUploadError}</p>
                )}

                {inlineFile && (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleInlineUpload}
                      disabled={inlineUploading}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {inlineUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>Upload & Attach</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Resumes Radio List */}
            {resumes.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center space-y-3 border border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  You haven't uploaded any resumes yet.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInlineUpload(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Resume Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {resumes.map((resume) => {
                  const isSelected = selectedResumeId === resume._id;
                  return (
                    <label
                      key={resume._id}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="resume"
                          value={resume._id}
                          checked={isSelected}
                          onChange={() => setSelectedResumeId(resume._id)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {resume.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {resume.resumeId} • Uploaded {new Date(resume.uploadedAt || resume.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {resume.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Primary
                          </span>
                        )}
                        {isSelected && (
                          <FileCheck className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: Cover Letter */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Cover Letter
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explain why you are the best fit for this position at {job.companyId?.name}.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {coverLetter.length} / 5000 chars
              </span>
            </div>

            <textarea
              id="cover-letter-input"
              rows={6}
              maxLength={5000}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Dear Hiring Team,&#10;&#10;I am excited to apply for the Full Stack Engineer role..."
              className="w-full p-4 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans"
            />
          </div>

          {/* SECTION 3: Additional Notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  3. Additional Notes
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Notice period, portfolio links, or specific scheduling preferences.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {notes.length} / 2000 chars
              </span>
            </div>

            <textarea
              id="notes-input"
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Available to start within 2 weeks. GitHub: github.com/username..."
              className="w-full p-4 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans"
            />
          </div>

          {/* Submission Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Submitting as:</span> {user?.name} ({user?.email})
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/jobs/${job._id}`}
                className="w-full sm:w-auto px-5 py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                id="submit-application-btn"
                disabled={submitting || !!existingApplication || resumes.length === 0}
                className="w-full sm:w-auto px-7 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
