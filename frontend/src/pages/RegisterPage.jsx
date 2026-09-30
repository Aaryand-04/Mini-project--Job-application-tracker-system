import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    skills: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Indian mobile number input formatting (e.g., 98765 43210)
  const handlePhoneChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    // If user pasted with country code 91 and length is 12, strip leading 91
    if (raw.startsWith('91') && raw.length > 10) {
      raw = raw.slice(2);
    }
    // If user typed leading 0 (STD code) and length > 10, strip leading 0
    if (raw.startsWith('0') && raw.length > 10) {
      raw = raw.slice(1);
    }
    // Limit to max 10 digits
    raw = raw.slice(0, 10);

    // Format as 5 digits + space + 5 digits: e.g. 98765 43210
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)} ${raw.slice(5)}`;
    }
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    // Client-side validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setLocalError('Please fill in all required fields (Name, Email, and Password).');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    // Validate Indian mobile number format if entered
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length > 0) {
      if (phoneDigits.length < 10) {
        setLocalError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      if (!/^[6-9]/.test(phoneDigits)) {
        setLocalError('Indian mobile numbers must start with 6, 7, 8, or 9.');
        return;
      }
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      phone: phoneDigits ? `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}` : ''
    };
    const result = await register(payload);
    setIsSubmitting(false);

    if (result.success) {
      // Activity diagram: Continue to Search for Jobs
      navigate('/dashboard', { replace: true });
    } else {
      setLocalError(result.error || 'Registration failed. Please check your information.');
    }
  };

  // Parse skills into preview tags
  const skillTags = formData.skills
    ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create your Applicant Account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Join the Job Application Tracking System to discover and apply for top opportunities.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
          {/* Error Banner */}
          {localError && (
            <div
              id="register-error-alert"
              className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm animate-shake"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Notice</p>
                <p className="text-xs text-rose-600 mt-0.5">{localError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name and Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Password * (min. 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mobile Number and Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between"
                >
                  <span>Mobile Number</span>
                  {formData.phone.replace(/\D/g, '').length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      {formData.phone.replace(/\D/g, '').length}/10 digits
                    </span>
                  )}
                </label>
                <div className="relative flex rounded-xl shadow-sm">
                  <div className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100/90 text-slate-700 text-xs font-semibold select-none gap-1.5 shrink-0">
                    <span className="text-sm leading-none" role="img" aria-label="India flag">🇮🇳</span>
                    <span className="font-mono text-slate-800 font-bold">+91</span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    maxLength={11}
                    className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  10-digit Indian format (e.g. 98765 43210)
                </p>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Skills (comma separated)
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, Express, MongoDB, Tailwind CSS"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {/* Live Skill Badges Preview */}
              {skillTags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {skillTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
