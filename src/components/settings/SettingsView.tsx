import React, { useState, useEffect } from 'react';
import { Sliders, Shield, History, RotateCcw, Check, AlertCircle, Save } from 'lucide-react';
import { ScoringWeights, AuditLog } from '../../types/ats';

interface SettingsViewProps {
  onWeightsUpdated?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onWeightsUpdated }) => {
  const [weights, setWeights] = useState<ScoringWeights>({
    requiredSkills: 30,
    experience: 20,
    responsibilities: 15,
    preferredSkills: 10,
    projects: 10,
    education: 5,
    certifications: 5,
    relevance: 5,
  });

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings?.scoringWeights) {
        setWeights(data.settings.scoringWeights);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + Number(b), 0);
  const isValidTotal = totalWeight === 100;

  const handleWeightChange = (key: keyof ScoringWeights, val: number) => {
    setWeights(prev => ({ ...prev, [key]: Math.max(0, val) }));
    setSaveSuccess(false);
  };

  const handleSaveWeights = async () => {
    if (!isValidTotal) {
      alert(`The sum of weights must equal 100%. Current sum: ${totalWeight}%`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoringWeights: weights })
      });
      if (res.ok) {
        setSaveSuccess(true);
        onWeightsUpdated?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Reset all jobs, candidates, and screening analyses back to initial demo dataset?')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: ATS Scoring Weights Customizer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Default ATS Scoring Weights
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize how candidate resumes are evaluated across categories. Total must equal 100%.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                isValidTotal
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              Total: {totalWeight}% {isValidTotal ? '✓ Valid' : '✗ Must equal 100%'}
            </span>

            <button
              onClick={handleSaveWeights}
              disabled={!isValidTotal || isSaving}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Weights
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Skills
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.requiredSkills}
                onChange={(e) => handleWeightChange('requiredSkills', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relevant Experience
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.experience}
                onChange={(e) => handleWeightChange('experience', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsibilities
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.responsibilities}
                onChange={(e) => handleWeightChange('responsibilities', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Skills
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.preferredSkills}
                onChange={(e) => handleWeightChange('preferredSkills', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Projects Relevance
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.projects}
                onChange={(e) => handleWeightChange('projects', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Education Match
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.education}
                onChange={(e) => handleWeightChange('education', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certifications
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.certifications}
                onChange={(e) => handleWeightChange('certifications', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Semantic Relevance
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={weights.relevance}
                onChange={(e) => handleWeightChange('relevance', Number(e.target.value))}
                className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
              />
              <span className="text-xs text-slate-500">% weight</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Fairness & Responsible AI Safeguards */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            Responsible AI & Non-Discrimination Policy
          </h3>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed space-y-2">
          <p className="font-semibold">
            Strict Employment Fairness Guarantee:
          </p>
          <p>
            This system evaluates candidates strictly on verified skills, career history, education, and project portfolios. It does NOT analyze or consider protected demographics including race, gender, age, religion, marital status, nationality, sexual orientation, disability, or personal photographs.
          </p>
          <p className="italic text-[11px] text-emerald-800">
            "AI-generated scores are intended to assist recruiters and should not be used as the sole basis for employment decisions. Recruiters should review candidate qualifications and the original resume before making decisions."
          </p>
        </div>
      </div>

      {/* Section 3: Audit Trail Log */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Recruitment Activity Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable log of screening actions, score calculations, and status transitions
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-xs flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-indigo-700 mr-2">[{log.action}]</span>
                <span className="text-slate-700">{log.details}</span>
              </div>
              <div className="text-right text-[11px] text-slate-400 shrink-0 ml-4">
                <span>{log.userName}</span> • <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Demo Data Reset */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Reset Demo Environment</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Restores initial 5 jobs, 18 realistic candidates, and screening analyses.
          </p>
        </div>
        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {isResetting ? 'Resetting...' : 'Reset Demo Data'}
        </button>
      </div>
    </div>
  );
};
