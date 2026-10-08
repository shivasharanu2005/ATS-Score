import React from 'react';
import { Briefcase, Users, CheckCircle2, Calendar, Target, Award, Sparkles } from 'lucide-react';

interface StatCardsProps {
  metrics: {
    totalJobs: number;
    activeJobs: number;
    totalCandidates: number;
    shortlisted: number;
    interviews: number;
    avgScore: number;
    shortlistRate?: number;
  };
}

export const StatCards: React.FC<StatCardsProps> = ({ metrics }) => {
  const cards = [
    {
      label: 'Total Jobs',
      value: metrics.totalJobs,
      subValue: `${metrics.activeJobs} active`,
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Total Candidates',
      value: metrics.totalCandidates,
      subValue: 'Screened by ATS',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Average ATS Score',
      value: `${metrics.avgScore}%`,
      subValue: 'Across all applicants',
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Shortlisted',
      value: metrics.shortlisted,
      subValue: `${metrics.shortlistRate || 0}% shortlist rate`,
      icon: CheckCircle2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      label: 'Interviews Scheduled',
      value: metrics.interviews,
      subValue: 'Active pipeline',
      icon: Calendar,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                {card.subValue}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
