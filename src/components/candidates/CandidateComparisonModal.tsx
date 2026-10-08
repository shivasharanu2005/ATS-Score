import React from 'react';
import { X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Application } from '../../types/ats';
import { CircularScore } from '../ui/CircularScore';
import { StatusBadge } from '../ui/StatusBadge';
import { SkillBadge } from '../ui/SkillBadge';

interface CandidateComparisonModalProps {
  applications: Application[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate: (app: Application) => void;
}

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  applications,
  isOpen,
  onClose,
  onSelectCandidate
}) => {
  if (!isOpen || applications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Side-by-Side Candidate Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing {applications.length} candidate(s) for {applications[0]?.jobTitle || 'Role'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix comparison content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-44">
                    Metric / Criterion
                  </th>
                  {applications.map((app) => (
                    <th key={app.id} className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm mb-2">
                          {app.candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[160px]">
                          {app.candidate.name}
                        </span>
                        <div className="mt-1">
                          <StatusBadge status={app.status} size="sm" />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* Overall ATS Score */}
                <tr className="bg-slate-50/60 font-semibold">
                  <td className="py-4 px-4 text-slate-700 font-bold">Overall ATS Score</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-4 px-4 text-center">
                      <CircularScore score={app.atsScore} size="sm" />
                    </td>
                  ))}
                </tr>

                {/* AI Recommendation */}
                <tr>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">AI Recommendation</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-3.5 px-4 text-center">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        {app.analysis?.recommendation || 'Evaluated'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Required Skills Match */}
                <tr>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">Required Skills (30%)</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-3.5 px-4 text-center">
                      <div className="font-bold text-slate-900 text-sm">
                        {app.analysis?.breakdown?.requiredSkills?.score ?? 0} / 30
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {app.analysis?.breakdown?.requiredSkills?.matched?.length || 0} matched,{' '}
                        {app.analysis?.breakdown?.requiredSkills?.missing?.length || 0} missing
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Experience Match */}
                <tr>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">Experience Match (20%)</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-3.5 px-4 text-center">
                      <div className="font-bold text-slate-900 text-sm">
                        {app.analysis?.breakdown?.experience?.score ?? 0} / 20
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        {app.candidate.totalExperienceYears} yrs experience
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Preferred Skills */}
                <tr>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">Preferred Skills (10%)</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {app.analysis?.breakdown?.preferredSkills?.score ?? 0} / 10
                    </td>
                  ))}
                </tr>

                {/* Projects */}
                <tr>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">Projects Score (10%)</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {app.analysis?.breakdown?.projects?.score ?? 0} / 10
                    </td>
                  ))}
                </tr>

                {/* Education */}
                <tr>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">Education Match (5%)</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {app.analysis?.breakdown?.education?.degree || app.candidate.education[0]?.degree || 'Degree'}
                    </td>
                  ))}
                </tr>

                {/* Top Skills */}
                <tr>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">Candidate Skills</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-3.5 px-4 text-center">
                      <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                        {app.candidate.skills.slice(0, 5).map((sk) => (
                          <SkillBadge key={sk} skill={sk} size="sm" />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="bg-slate-50/40">
                  <td className="py-4 px-4 text-slate-700 font-semibold">Review Candidate</td>
                  {applications.map((app) => (
                    <td key={app.id} className="py-4 px-4 text-center">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectCandidate(app);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                      >
                        Open Full Profile
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
