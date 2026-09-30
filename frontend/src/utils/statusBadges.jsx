import React from 'react';
import { Clock, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Returns a styled, accessible, and responsive status badge element.
 *
 * @param {string} status - Application status ('Applied', 'Shortlisted', 'Hired', 'Rejected')
 * @param {Object} [options] - Options for badge rendering
 * @param {string} [options.size] - 'sm' | 'md' | 'lg' (default: 'sm')
 * @param {boolean} [options.showPulse] - Whether to show pulse on 'Applied'
 */
export function StatusBadge({ status, size = 'sm', showPulse = true }) {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  }[size] || 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'Applied':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 ${sizeClasses}`}
        >
          {showPulse ? (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span>Applied</span>
        </span>
      );

    case 'Shortlisted':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${sizeClasses}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Shortlisted</span>
        </span>
      );

    case 'Hired':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hired</span>
        </span>
      );

    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Rejected</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center rounded-full font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/40 ${sizeClasses}`}
        >
          <span>{status || 'Unknown'}</span>
        </span>
      );
  }
}

/**
 * Helper function returning the badge JSX directly
 */
export function getStatusBadge(status, options = {}) {
  return <StatusBadge status={status} {...options} />;
}

export default StatusBadge;
