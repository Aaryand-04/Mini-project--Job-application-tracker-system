import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../services/jobService';
import { resumeService } from '../services/resumeService';
import { applicationService } from '../services/applicationService';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Globe,
  Share2,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated, isApplicant } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await jobService.getJobById(id);
        if (res.success && res.job) {
          setJob(res.job);
          // Check if applicant already applied
          if (isAuthenticated && isApplicant) {
            try {
              const myApps = await applicationService.getMyApplications();
              if (myApps.success && myApps.applications) {
                const found = myApps.applications.find(
                  (a) => a.jobId?._id === res.job._id || a.jobId === res.job._id
                );
                if (found) setAlreadyApplied(found);
              }
            } catch (_) {}
          }
        } else {
          setError('Job posting not found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve job details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, isAuthenticated, isApplicant]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error || "The job posting you are looking for may have been closed or removed."}
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Jobs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-20">
      {/* Top Breadcrumb & Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Job Search</span>
          </Link>

          <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            {job.jobId}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Requisition Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{job.type}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {job.title}
              </h1>

              {/* Company & Location Details */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>{job.companyId?.name || 'Verified Company'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Posted on {new Date(job.postedDate || job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Apply Button CTA */}
            <div className="flex sm:flex-col items-center gap-3">
              {alreadyApplied ? (
                <Link
                  to="/applications"
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Applied ({alreadyApplied.status})</span>
                </Link>
              ) : (
                <Link
                  to={`/jobs/${job._id}/apply`}
                  id="apply-job-btn"
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply for Job</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Specification Pills */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Experience</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{job.experienceLevel}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Job Type</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{job.type}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Location</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block truncate">{job.location}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Status</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-sm mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Open
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Content: Description & Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Job Description */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-3">
              Full Job Description & Responsibilities
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-sans space-y-4">
              {job.description}
            </div>

            {/* Bottom Apply CTA */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Interested in this role?</p>
                <p className="text-sm font-bold text-slate-900">
                  {alreadyApplied ? 'You have submitted an application' : 'Submit your application today'}
                </p>
              </div>
              {alreadyApplied ? (
                <Link
                  to="/applications"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>View Status</span>
                </Link>
              ) : (
                <Link
                  to={`/jobs/${job._id}/apply`}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Apply Now
                </Link>
              )}
            </div>
          </div>

          {/* Company Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                About the Company
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-100">
                    {job.companyId?.name ? job.companyId.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{job.companyId?.name}</h4>
                    <p className="text-slate-500">{job.companyId?.industry || 'Enterprise'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Headquarters: {job.companyId?.location || job.location}</span>
                  </div>
                  {job.companyId?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={job.companyId.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {job.companyId.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Progress Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 p-5 space-y-3">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Activity Diagram Swimlane
              </span>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">✓ Search for Jobs (Step 6)</div>
                <div className="font-semibold text-slate-900">✓ View Job Details (Step 6)</div>
                <div className="font-semibold text-slate-900">✓ Upload/Select Resume (Step 7)</div>
                <div className="font-semibold text-blue-700">⚡ Apply for Job & View Status (Step 8)</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
