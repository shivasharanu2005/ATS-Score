import React from 'react';
import { CandidateStatus } from '../../types/ats';

interface StatusBadgeProps {
  status: CandidateStatus | 'Active' | 'Draft' | 'Closed';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles: Record<string, string> = {
    'New': 'bg-sky-50 text-sky-700 border-sky-200',
    'Screening': 'bg-violet-50 text-violet-700 border-violet-200',
    'Shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Interview': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Selected': 'bg-teal-50 text-teal-700 border-teal-200',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
    'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Draft': 'bg-slate-100 text-slate-700 border-slate-200',
    'Closed': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const dots: Record<string, string> = {
    'New': 'bg-sky-500',
    'Screening': 'bg-violet-500',
    'Shortlisted': 'bg-emerald-500',
    'Interview': 'bg-indigo-500',
    'Selected': 'bg-teal-500',
    'Rejected': 'bg-rose-500',
    'On Hold': 'bg-amber-500',
    'Active': 'bg-emerald-500',
    'Draft': 'bg-slate-400',
    'Closed': 'bg-rose-500',
  };

  const currentStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const currentDot = dots[status] || 'bg-slate-400';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${sizeClasses} ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
      {status}
    </span>
  );
};
