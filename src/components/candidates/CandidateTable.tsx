import React, { useState } from 'react';
import {
  Search, Filter, ArrowUpDown, CheckSquare, Square, Download,
  SlidersHorizontal, CheckCircle2, XCircle, Calendar, Sparkles, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { Application, CandidateStatus } from '../../types/ats';
import { CircularScore } from '../ui/CircularScore';
import { StatusBadge } from '../ui/StatusBadge';
import { SkillBadge } from '../ui/SkillBadge';

interface CandidateTableProps {
  applications: Application[];
  onSelectCandidate: (app: Application) => void;
  onStatusChange: (appId: string, status: CandidateStatus) => void;
  onBulkStatusChange: (appIds: string[], status: CandidateStatus) => void;
  onCompare: (selectedApps: Application[]) => void;
  onOpenUpload: () => void;
  selectedJobId?: string;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  applications,
  onSelectCandidate,
  onStatusChange,
  onBulkStatusChange,
  onCompare,
  onOpenUpload,
  selectedJobId
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'name' | 'date'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter applications
  const filtered = applications.filter((app) => {
    if (statusFilter !== 'All' && app.status !== statusFilter) return false;
    if (app.atsScore < minScoreFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = app.candidate.name.toLowerCase().includes(q);
      const matchEmail = app.candidate.email.toLowerCase().includes(q);
      const matchSkills = app.candidate.skills.some((s) => s.toLowerCase().includes(q));
      const matchJob = (app.jobTitle || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchSkills && !matchJob) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'score') return (a.atsScore - b.atsScore) * order;
    if (sortBy === 'experience') return (a.candidate.totalExperienceYears - b.candidate.totalExperienceYears) * order;
    if (sortBy === 'name') return a.candidate.name.localeCompare(b.candidate.name) * order;
    if (sortBy === 'date') return (new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime()) * order;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    const appsToExport = selectedIds.length > 0
      ? applications.filter(a => selectedIds.includes(a.id))
      : filtered;

    const headers = ['Candidate', 'Email', 'Phone', 'Job Title', 'ATS Score', 'Experience (Yrs)', 'Status', 'Applied Date'];
    const rows = appsToExport.map(a => [
      `"${a.candidate.name}"`,
      `"${a.candidate.email}"`,
      `"${a.candidate.phone}"`,
      `"${a.jobTitle || ''}"`,
      a.atsScore,
      a.candidate.totalExperienceYears,
      `"${a.status}"`,
      `"${a.appliedDate.split('T')[0]}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidate_rankings_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedApps = applications.filter(a => selectedIds.includes(a.id));

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidates, skills, emails..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Screening">Screening</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Selected">Selected</option>
              <option value="On Hold">On Hold</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Min score filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Min Score:</span>
            <select
              value={minScoreFilter}
              onChange={(e) => { setMinScoreFilter(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="0">All Scores (0+)</option>
              <option value="60">60+ Moderate</option>
              <option value="75">75+ Good Match</option>
              <option value="85">85+ Strong Match</option>
              <option value="90">90+ Top Tier</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="score">ATS Score</option>
              <option value="experience">Experience</option>
              <option value="name">Name</option>
              <option value="date">Applied Date</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-900 text-white p-3 rounded-xl shadow-lg flex items-center justify-between transition-all animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-indigo-800 px-2.5 py-1 rounded-md">
              {selectedIds.length} candidate(s) selected
            </span>
            <span className="text-xs text-indigo-200 hidden sm:inline">
              Perform bulk HR actions across selection
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkStatusChange(selectedIds, 'Shortlisted')}
              className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Shortlist All
            </button>
            <button
              onClick={() => onBulkStatusChange(selectedIds, 'Interview')}
              className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              Move to Interview
            </button>
            <button
              onClick={() => onBulkStatusChange(selectedIds, 'Rejected')}
              className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject All
            </button>
            {selectedApps.length >= 2 && selectedApps.length <= 4 && (
              <button
                onClick={() => onCompare(selectedApps)}
                className="px-3 py-1 text-xs font-bold bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Compare ({selectedApps.length})
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-indigo-300 hover:text-white px-2 py-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No candidates match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your score threshold, status filter, or upload additional resumes to screen.
            </p>
            <button
              onClick={onOpenUpload}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              Upload Resumes
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {selectedIds.length === paginated.length && paginated.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-14">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Applied Job</th>
                  <th className="py-3 px-4 text-center">ATS Score</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Top Skills</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginated.map((app, index) => {
                  const globalRank = (currentPage - 1) * pageSize + index + 1;
                  const isSelected = selectedIds.includes(app.id);

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleSelectOne(app.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Rank */}
                      <td className="py-3.5 px-3 font-bold text-slate-400">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold ${
                          globalRank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          globalRank === 2 ? 'bg-slate-200 text-slate-700' :
                          globalRank === 3 ? 'bg-orange-100 text-orange-800' :
                          'text-slate-500'
                        }`}>
                          #{globalRank}
                        </span>
                      </td>

                      {/* Candidate details */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectCandidate(app)}
                          className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {app.candidate.name}
                        </button>
                        <p className="text-[11px] text-slate-400">{app.candidate.email}</p>
                      </td>

                      {/* Job */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">
                          {app.jobTitle || 'General Engineering'}
                        </span>
                      </td>

                      {/* Circular ATS Score */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <CircularScore score={app.atsScore} size="sm" showLabel={false} />
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {app.candidate.totalExperienceYears} yrs
                      </td>

                      {/* Skills */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {app.candidate.skills.slice(0, 3).map((sk) => (
                            <SkillBadge key={sk} skill={sk} size="sm" />
                          ))}
                          {app.candidate.skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{app.candidate.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={app.status}
                          onChange={(e) => onStatusChange(app.id, e.target.value as CandidateStatus)}
                          className="text-[11px] font-semibold py-1 px-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-hidden"
                        >
                          <option value="New">New</option>
                          <option value="Screening">Screening</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectCandidate(app)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="View Full Profile & ATS Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {app.status !== 'Shortlisted' && (
                            <button
                              onClick={() => onStatusChange(app.id, 'Shortlisted')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Shortlist Candidate"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Showing {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length} candidates</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white"
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
