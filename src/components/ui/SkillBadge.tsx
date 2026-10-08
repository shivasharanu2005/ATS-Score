import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

interface SkillBadgeProps {
  skill: string;
  status?: 'matched' | 'missing' | 'partial' | 'neutral';
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  status = 'neutral',
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (status === 'matched') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md ${sizeClasses}`}>
        <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
        {skill}
      </span>
    );
  }

  if (status === 'missing') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium bg-rose-50 text-rose-800 border border-rose-200/80 rounded-md ${sizeClasses}`}>
        <X className="w-3 h-3 text-rose-600 stroke-[2.5]" />
        {skill}
      </span>
    );
  }

  if (status === 'partial') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md ${sizeClasses}`}>
        <AlertTriangle className="w-3 h-3 text-amber-600 stroke-[2.5]" />
        {skill}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-md ${sizeClasses}`}>
      {skill}
    </span>
  );
};
