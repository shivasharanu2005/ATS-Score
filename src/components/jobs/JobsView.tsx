import React, { useState } from 'react';
import {
  Search, Plus, Upload, Users, Briefcase, MapPin, MoreVertical,
  CheckCircle2, AlertCircle, Edit2, Trash2, ArrowRight
} from 'lucide-react';
import { Job } from '../../types/ats';
import { StatusBadge } from '../ui/StatusBadge';

interface JobsViewProps {
  jobs: Job[];
  onOpenCreateJob: () => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (jobId: string) => void;
  onSelectJobForCandidates: (jobId: string) => void;
  onOpenUploadForJob: (job: Job) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  onOpenCreateJob,
  onEditJob,
  onDeleteJob,
  onSelectJobForCandidates,
  onOpenUploadForJob
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredJobs = jobs.filter(j => {
    if (statusFilter !== 'All' && j.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = j.title.toLowerCase().includes(q);
      const matchDept = j.department.toLowerCase().includes(q);
      const matchLoc = j.location.toLowerCase().includes(q);
      if (!matchTitle && !matchDept && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job Openings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage active roles, screening criteria, and applicant pools
          </p>
        </div>

        <button
          onClick={onOpenCreateJob}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Job
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search job titles, departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-600">
          <span className="font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
          >
            <option value="All">All Jobs</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No jobs found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create your first job opening to start screening candidates with AI.
          </p>
          <button
            onClick={onOpenCreateJob}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            Create Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200/90 hover:border-indigo-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onSelectJobForCandidates(job.id)}>
                    {job.title}
                  </h3>
                  <StatusBadge status={job.status} size="sm" />
                </div>

                <div className="space-y-1 text-xs text-slate-500 mb-4">
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {job.department} • {job.employmentType} ({job.workMode})
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </p>
                </div>

                {/* Criteria Tags */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Required Skills
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 4).map((sk) => (
                      <span
                        key={sk}
                        className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {sk}
                      </span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="text-[10px] font-medium text-slate-400 self-center">
                        +{job.requiredSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Candidate Stats bar */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Screened Candidates</span>
                    <span className="text-sm font-bold text-slate-900">
                      {job.candidateCount || 0}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Avg ATS Score</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {job.avgAtsScore ? `${job.avgAtsScore}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditJob(job)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit Job"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete job "${job.title}"?`)) onDeleteJob(job.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenUploadForJob(job)}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                  <button
                    onClick={() => onSelectJobForCandidates(job.id)}
                    className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1"
                  >
                    Candidates
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
