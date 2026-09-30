import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jobService } from '../services/jobService';
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Filter,
  ArrowRight,
  Sparkles,
  X,
  Loader2,
  SlidersHorizontal
} from 'lucide-react';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const EXPERIENCE_LEVELS = ['All', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead / Executive'];

export default function JobListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state initialized from URL params if present
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('location') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'All');
  const [selectedExp, setSelectedExp] = useState(searchParams.get('experienceLevel') || 'All');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'newest');

  // Job data state
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch jobs from backend API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (locationTerm.trim()) params.location = locationTerm.trim();
      if (selectedType !== 'All') params.type = selectedType;
      if (selectedExp !== 'All') params.experienceLevel = selectedExp;
      if (selectedSort) params.sort = selectedSort;

      const res = await jobService.getJobs(params);
      if (res.success) {
        setJobs(res.jobs || []);
        setTotalJobs(res.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job listings.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on filter change
  useEffect(() => {
    fetchJobs();
  }, [selectedType, selectedExp, selectedSort]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setSelectedType('All');
    setSelectedExp('All');
    setSelectedSort('newest');
    jobService.getJobs({ sort: 'newest' }).then((res) => {
      if (res.success) {
        setJobs(res.jobs || []);
        setTotalJobs(res.total || 0);
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 pb-16">
      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Step 6: Explore Verified Job Postings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Discover your next career milestone
            </h1>
            <p className="mt-2 text-sm sm:text-base text-blue-100/90">
              Browse actively hiring positions posted by verified recruiters across top industries.
            </p>
          </div>

          {/* Search Inputs Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white p-2.5 rounded-2xl shadow-xl shadow-indigo-950/20 grid grid-cols-1 md:grid-cols-12 gap-2 text-slate-800"
          >
            {/* Keyword Search */}
            <div className="md:col-span-5 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, keywords, or company..."
                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Location Search */}
            <div className="md:col-span-4 relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                id="location-input"
                type="text"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                placeholder="City (e.g. Pune, Remote)..."
                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Submit CTA */}
            <div className="md:col-span-3">
              <button
                id="search-btn"
                type="submit"
                className="w-full h-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </button>
            </div>
          </form>

          {/* Quick Job Type Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-blue-200 font-medium">Type:</span>
            {JOB_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Jobs Feed */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter & Sort Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900 text-sm">{totalJobs}</span>
            <span>active positions found</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Experience Level Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="exp-filter" className="text-slate-500 font-medium">
                Experience:
              </label>
              <select
                id="exp-filter"
                value={selectedExp}
                onChange={(e) => setSelectedExp(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="sort-filter" className="text-slate-500 font-medium">
                Sort:
              </label>
              <select
                id="sort-filter"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || locationTerm || selectedType !== 'All' || selectedExp !== 'All') && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Searching active job postings...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching jobs found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any active job postings matching your current search criteria. Try adjusting keywords or location.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* Company & Date */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="truncate">{job.companyId?.name || 'Verified Company'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(job.postedDate || job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>

                  {/* Location & Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
                      {job.type}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100">
                      {job.experienceLevel}
                    </span>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Footer Link */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {job.jobId}
                  </span>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
