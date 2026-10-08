import React, { useState } from 'react';
import {
  X, Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase, GraduationCap,
  FolderGit2, Award, Sparkles, CheckCircle2, AlertTriangle, FileText,
  RotateCw, Calendar, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Application, CandidateStatus } from '../../types/ats';
import { CircularScore } from '../ui/CircularScore';
import { StatusBadge } from '../ui/StatusBadge';
import { SkillBadge } from '../ui/SkillBadge';

interface CandidateDetailModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (appId: string, newStatus: CandidateStatus, note?: string) => void;
  onReanalyze: (appId: string) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  application,
  isOpen,
  onClose,
  onStatusChange,
  onReanalyze
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'experience' | 'resume' | 'evidence'>('analysis');
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus>(application.status);
  const [statusNote, setStatusNote] = useState('');
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  if (!isOpen) return null;

  const { candidate, analysis } = application;
  const breakdown = analysis?.breakdown;

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      if (selectedStatus === 'Shortlisted' || selectedStatus === 'Selected') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }
      await onStatusChange(application.id, selectedStatus, statusNote);
      setStatusNote('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReanalyzeClick = async () => {
    setIsReanalyzing(true);
    try {
      await onReanalyze(application.id);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
                <StatusBadge status={application.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Applied for <span className="font-semibold text-slate-700">{application.jobTitle || 'Job Opening'}</span> • {new Date(application.appliedDate).toLocaleDateString()}
              </p>
              {/* Contact meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.location}
                </span>
                {candidate.linkedin && (
                  <a
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                )}
                {candidate.github && (
                  <a
                    href={candidate.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-700 hover:underline"
                  >
                    <Github className="w-3.5 h-3.5" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReanalyzeClick}
              disabled={isReanalyzing}
              title="Re-run ATS scoring against current job weights"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
            >
              <RotateCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-200 flex gap-6 bg-white">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            ATS Score Breakdown
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'experience'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Experience & Timeline ({candidate.totalExperienceYears} yrs)
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Resume Evidence Citations
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'resume'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Original Resume ({candidate.originalFileName})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Top Banner: Score & AI Recruiter Summary */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/50 p-5 rounded-2xl border border-indigo-100/80 flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0 flex flex-col items-center">
                  <CircularScore score={application.atsScore} size="lg" />
                  <button
                    onClick={() => setShowWhyModal(!showWhyModal)}
                    className="mt-2 text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Why this score?
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                      AI Recruiter Summary
                    </span>
                    {analysis?.isAiGenerated ? (
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        Gemini 3.8 Intelligence
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500">
                        Deterministic ATS Engine
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {analysis?.aiSummary || 'Evaluation completed according to configured job criteria.'}
                  </p>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {analysis?.strengths?.slice(0, 2).map((s, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-medium">{s}</span>
                      </div>
                    ))}
                    {analysis?.gaps?.slice(0, 2).map((g, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-rose-800 bg-rose-50/80 p-2 rounded-lg border border-rose-100">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-medium">{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expandable "Why this score" explanation card */}
              {showWhyModal && analysis?.whyThisScore && (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3 transition-all">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    Transparent ATS Score Explanation ({application.atsScore}/100)
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {analysis.whyThisScore.positives.map((p, i) => (
                      <p key={i} className="text-emerald-700 font-medium">{p}</p>
                    ))}
                    {analysis.whyThisScore.negatives.map((n, i) => (
                      <p key={i} className="text-rose-700 font-medium">{n}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic pt-1 border-t border-indigo-100">
                    *Responsible AI Guarantee: Scoring strictly measures job-relevant criteria. Protected demographics are never inferred or used.
                  </p>
                </div>
              )}

              {/* Explainable 8-Category Score Breakdown Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Score Category Breakdown (Explainable Weights)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Required Skills */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Required Skills</span>
                      <span className="font-bold text-indigo-600">
                        {breakdown?.requiredSkills?.score ?? 0}/{breakdown?.requiredSkills?.max ?? 30}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.requiredSkills?.score || 0) / (breakdown?.requiredSkills?.max || 30)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {breakdown?.requiredSkills?.matched?.length || 0} matched, {breakdown?.requiredSkills?.missing?.length || 0} missing
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Experience Match</span>
                      <span className="font-bold text-blue-600">
                        {breakdown?.experience?.score ?? 0}/{breakdown?.experience?.max ?? 20}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.experience?.score || 0) / (breakdown?.experience?.max || 20)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {breakdown?.experience?.candidateYears} yrs vs {breakdown?.experience?.requiredYears} yrs required
                    </p>
                  </div>

                  {/* Responsibilities */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Responsibilities</span>
                      <span className="font-bold text-emerald-600">
                        {breakdown?.responsibilities?.score ?? 0}/{breakdown?.responsibilities?.max ?? 15}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.responsibilities?.score || 0) / (breakdown?.responsibilities?.max || 15)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Alignment: {breakdown?.responsibilities?.alignment || 'High'}
                    </p>
                  </div>

                  {/* Preferred Skills */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Preferred Skills</span>
                      <span className="font-bold text-teal-600">
                        {breakdown?.preferredSkills?.score ?? 0}/{breakdown?.preferredSkills?.max ?? 10}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.preferredSkills?.score || 0) / (breakdown?.preferredSkills?.max || 10)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {breakdown?.preferredSkills?.matched?.length || 0} bonus skills identified
                    </p>
                  </div>

                  {/* Projects */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Projects Relevance</span>
                      <span className="font-bold text-indigo-600">
                        {breakdown?.projects?.score ?? 0}/{breakdown?.projects?.max ?? 10}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.projects?.score || 0) / (breakdown?.projects?.max || 10)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {breakdown?.projects?.relevantCount || 1} relevant project(s)
                    </p>
                  </div>

                  {/* Education */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Education Match</span>
                      <span className="font-bold text-purple-600">
                        {breakdown?.education?.score ?? 0}/{breakdown?.education?.max ?? 5}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.education?.score || 0) / (breakdown?.education?.max || 5)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                      {breakdown?.education?.degree || 'Bachelor degree'}
                    </p>
                  </div>

                  {/* Certifications */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Certifications</span>
                      <span className="font-bold text-amber-600">
                        {breakdown?.certifications?.score ?? 0}/{breakdown?.certifications?.max ?? 5}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.certifications?.score || 0) / (breakdown?.certifications?.max || 5)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {breakdown?.certifications?.items?.length || 0} credential(s) listed
                    </p>
                  </div>

                  {/* Semantic Relevance */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Semantic Relevance</span>
                      <span className="font-bold text-rose-600">
                        {breakdown?.relevance?.score ?? 0}/{breakdown?.relevance?.max ?? 5}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full"
                        style={{ width: `${Math.round(((breakdown?.relevance?.score || 0) / (breakdown?.relevance?.max || 5)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Domain keyword coverage
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills Analysis Tag Area */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Skills Assessment
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Matching Required Skills ({breakdown?.requiredSkills?.matched?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {breakdown?.requiredSkills?.matched?.map((s) => (
                        <SkillBadge key={s} skill={s} status="matched" />
                      ))}
                      {(!breakdown?.requiredSkills?.matched || breakdown.requiredSkills.matched.length === 0) && (
                        <span className="text-xs text-slate-400 italic">No matching required skills identified.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Missing Required Skills ({breakdown?.requiredSkills?.missing?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {breakdown?.requiredSkills?.missing?.map((s) => (
                        <SkillBadge key={s} skill={s} status="missing" />
                      ))}
                      {(!breakdown?.requiredSkills?.missing || breakdown.requiredSkills.missing.length === 0) && (
                        <span className="text-xs text-emerald-600 font-medium">All required skills identified!</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Preferred Skills ({breakdown?.preferredSkills?.matched?.length || 0} matched)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {breakdown?.preferredSkills?.matched?.map((s) => (
                        <SkillBadge key={s} skill={s} status="matched" />
                      ))}
                      {breakdown?.preferredSkills?.missing?.map((s) => (
                        <SkillBadge key={s} skill={s} status="missing" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-6">
              {/* Experience timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Work Experience History ({candidate.totalExperienceYears} Years Total)
                </h3>
                <div className="space-y-4 border-l-2 border-indigo-200 pl-4 ml-2">
                  {candidate.experienceTimeline.map((exp, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                            <p className="text-xs font-medium text-slate-600">{exp.company}</p>
                          </div>
                          <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {exp.startDate} – {exp.endDate}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {exp.technologies.map(t => (
                              <span key={t} className="text-[10px] font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Education
                </h3>
                <div className="space-y-2">
                  {candidate.education.map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{edu.degree}</p>
                          <p className="text-xs text-slate-500">{edu.institution}</p>
                        </div>
                      </div>
                      {edu.graduationYear && (
                        <span className="text-xs font-medium text-slate-500">{edu.graduationYear}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              {candidate.projects.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Demonstrated Projects
                  </h3>
                  <div className="space-y-2">
                    {candidate.projects.map((proj, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <FolderGit2 className="w-4 h-4 text-indigo-600" />
                            {proj.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Resume Evidence Citations
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Every ATS score factor is anchored to extracted content in the resume. This eliminates hallucinations.
                </p>
              </div>

              <div className="space-y-2">
                {analysis?.skillEvidences?.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <SkillBadge skill={ev.skill} status={ev.status} size="sm" />
                        <span className="text-xs font-bold text-slate-700">{ev.skill}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 font-mono bg-white p-2 rounded-md border border-slate-100">
                        "{ev.source}"
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      {Math.round(ev.confidence * 100)}% verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Original Extracted Resume Document
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  File: {candidate.originalFileName}
                </span>
              </div>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto selection:bg-indigo-500 selection:text-white">
                {candidate.originalResumeText}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Candidate Status Management */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-700 shrink-0">Update Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as CandidateStatus)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="New">New</option>
              <option value="Screening">Screening</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Selected">Selected</option>
              <option value="On Hold">On Hold</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input
              type="text"
              placeholder="Optional status note..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white w-48 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating || selectedStatus === application.status && !statusNote}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-all"
            >
              Apply
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
