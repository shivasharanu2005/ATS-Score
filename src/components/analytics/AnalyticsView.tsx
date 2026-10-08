import React from 'react';
import { Target, Users, Award, TrendingUp, CheckCircle, BarChart3, PieChart } from 'lucide-react';
import { ScoreDistributionChart } from '../dashboard/ScoreDistributionChart';

interface AnalyticsData {
  metrics: {
    totalJobs: number;
    activeJobs: number;
    totalCandidates: number;
    shortlisted: number;
    interviews: number;
    selected: number;
    rejected: number;
    avgScore: number;
    shortlistRate: number;
    interviewRate: number;
    selectionRate: number;
  };
  scoreDistribution: Array<{ range: string; count: number; fill: string }>;
  funnel: Array<{ stage: string; count: number; color: string }>;
  topSkills: Array<{ skill: string; count: number }>;
  recentJobs: Array<any>;
}

interface AnalyticsViewProps {
  data: AnalyticsData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data }) => {
  const { metrics, scoreDistribution, funnel, topSkills, recentJobs } = data;
  const maxSkillCount = Math.max(1, ...(topSkills || []).map(s => s.count));

  return (
    <div className="space-y-6">
      {/* Executive Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Average ATS Score</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.avgScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Objective multi-factor scoring</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Shortlist Rate</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.shortlistRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Candidates passing screening</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Interview Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.interviewRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Advanced to formal interview</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Selection Rate</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.selectionRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Final hires extended offers</p>
        </div>
      </div>

      {/* Score Distribution & Recruitment Funnel */}
      <ScoreDistributionChart distribution={scoreDistribution} funnel={funnel} />

      {/* Bottom Grid: Top In-Demand Candidate Skills & Job Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Extracted Candidate Skills */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Candidate Skills</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most prevalent technical proficiencies identified across applicants</p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {topSkills.map((sk) => {
              const widthPct = Math.round((sk.count / maxSkillCount) * 100);

              return (
                <div key={sk.skill} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="font-semibold">{sk.skill}</span>
                    <span className="text-slate-500">{sk.count} candidate(s)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Job Screening Performance */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Job Pipeline Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Applicant pool volume and average score per role</p>
            </div>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{job.title}</h4>
                  <p className="text-[11px] text-slate-500">{job.department} • {job.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-indigo-600">
                    {job.candidateCount || 0} candidate(s)
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Avg Score: {job.avgAtsScore ? `${job.avgAtsScore}%` : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
