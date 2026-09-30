import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  MapPin,
  Briefcase,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote'];

  const userSkills = user?.skills
    ? user.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 pb-16">
      {/* Hero Welcome & Search Banner */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Step 3: Authenticated as {user?.role || 'Applicant'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Applicant'}!
            </h1>
            <p className="mt-2 text-base sm:text-lg text-blue-100/90 leading-relaxed">
              Find and apply for open positions matching your skills and experience.
            </p>
          </div>

          {/* Search Bar matching Activity Diagram: "Search for Jobs" */}
          <div className="mt-8 bg-white p-3 rounded-2xl shadow-xl shadow-indigo-950/20 grid grid-cols-1 md:grid-cols-12 gap-3 text-slate-800">
            <div className="md:col-span-5 relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
              <input
                id="job-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, keywords, or company..."
                className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="md:col-span-4 relative flex items-center">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5" />
              <input
                id="job-location-input"
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="City, state, or 'Remote'..."
                className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="md:col-span-3">
              <button
                id="search-jobs-btn"
                className="w-full h-full py-2.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </button>
            </div>
          </div>

          {/* Job Type Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-blue-200 font-medium">Quick filters:</span>
            {jobTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  selectedType === type
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applicant Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm sticky top-24">
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{user?.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Applicant
                  </span>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user?.location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>

              {/* Skills section */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Your Skills
                </p>
                {userSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {userSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No skills listed yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Workflow & Next Steps View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Applicant Authentication Complete
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated via JWT
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                You have successfully registered and logged in. The credentials validation system confirmed your account identity, issued a secure JWT token, and routed you to the job discovery portal.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                  <p className="text-slate-400 font-medium">Session Type</p>
                  <p className="font-semibold text-slate-900 mt-0.5">JWT Bearer Auth</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                  <p className="text-slate-400 font-medium">Security</p>
                  <p className="font-semibold text-slate-900 mt-0.5">bcrypt Password Hash</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                  <p className="text-slate-400 font-medium">Next Step</p>
                  <p className="font-semibold text-blue-600 mt-0.5">Step 4: Job Listings</p>
                </div>
              </div>
            </div>

            {/* Activity Diagram Workflow Preview Card */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl border border-indigo-100 p-6">
              <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Next in Activity Diagram: Search & Apply</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                The next steps in the Applicant swimlane are:
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                  ✓ Register / Login
                </span>
                <span className="text-slate-400">➔</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
                  Search for Jobs
                </span>
                <span className="text-slate-400">➔</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">
                  View Job Details
                </span>
                <span className="text-slate-400">➔</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">
                  Apply (Upload Resume)
                </span>
                <span className="text-slate-400">➔</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">
                  View Status
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
