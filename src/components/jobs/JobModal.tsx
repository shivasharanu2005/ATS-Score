import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { Job, EmploymentType, WorkMode, ExperienceLevel } from '../../types/ats';

interface JobModalProps {
  jobToEdit?: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({
  jobToEdit,
  isOpen,
  onClose,
  onSave
}) => {
  const isEditing = Boolean(jobToEdit);

  const [title, setTitle] = useState(jobToEdit?.title || '');
  const [department, setDepartment] = useState(jobToEdit?.department || 'Engineering');
  const [location, setLocation] = useState(jobToEdit?.location || 'San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(jobToEdit?.employmentType || 'Full Time');
  const [workMode, setWorkMode] = useState<WorkMode>(jobToEdit?.workMode || 'Hybrid');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(jobToEdit?.experienceLevel || '3–5 years');
  const [minYearsExperience, setMinYearsExperience] = useState(jobToEdit?.minYearsExperience || 3);
  const [salaryRange, setSalaryRange] = useState(jobToEdit?.salaryRange || '$130,000 - $165,000');
  const [openings, setOpenings] = useState(jobToEdit?.openings || 1);
  const [status, setStatus] = useState<'Active' | 'Draft' | 'Closed'>(jobToEdit?.status || 'Active');

  const [description, setDescription] = useState(jobToEdit?.description || '');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(jobToEdit?.requiredSkills || ['Java', 'Spring Boot', 'REST API', 'SQL', 'Git']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(jobToEdit?.preferredSkills || ['AWS', 'Docker', 'Kubernetes']);
  const [responsibilities, setResponsibilities] = useState<string[]>(
    jobToEdit?.responsibilities || [
      'Design, build, and maintain efficient, reusable, and reliable backend code.',
      'Identify bottlenecks and bugs, and devise solutions to these problems.',
      'Help maintain code quality, organization, and automatization.'
    ]
  );
  const [educationRequirements, setEducationRequirements] = useState<string[]>(
    jobToEdit?.educationRequirements || ["Bachelor's degree in Computer Science or related field"]
  );

  const [reqInput, setReqInput] = useState('');
  const [prefInput, setPrefInput] = useState('');
  const [respInput, setRespInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleExtractFromJD = async () => {
    if (!description.trim()) {
      alert('Please enter or paste a Job Description first.');
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch('/api/jobs/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: description })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract requirements');

      const reqs = data.requirements;
      if (reqs.title && !title) setTitle(reqs.title);
      if (reqs.department) setDepartment(reqs.department);
      if (reqs.requiredSkills?.length) setRequiredSkills(reqs.requiredSkills);
      if (reqs.preferredSkills?.length) setPreferredSkills(reqs.preferredSkills);
      if (reqs.responsibilities?.length) setResponsibilities(reqs.responsibilities);
      if (reqs.educationRequirements?.length) setEducationRequirements(reqs.educationRequirements);
      if (reqs.minYearsExperience !== undefined) setMinYearsExperience(reqs.minYearsExperience);
      if (reqs.experienceLevel) setExperienceLevel(reqs.experienceLevel);
    } catch (err: any) {
      alert(err.message || 'Error extracting requirements');
    } finally {
      setIsExtracting(false);
    }
  };

  const addRequiredSkill = () => {
    if (reqInput.trim() && !requiredSkills.includes(reqInput.trim())) {
      setRequiredSkills([...requiredSkills, reqInput.trim()]);
      setReqInput('');
    }
  };

  const removeRequiredSkill = (idx: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== idx));
  };

  const addPreferredSkill = () => {
    if (prefInput.trim() && !preferredSkills.includes(prefInput.trim())) {
      setPreferredSkills([...preferredSkills, prefInput.trim()]);
      setPrefInput('');
    }
  };

  const removePreferredSkill = (idx: number) => {
    setPreferredSkills(preferredSkills.filter((_, i) => i !== idx));
  };

  const addResponsibility = () => {
    if (respInput.trim()) {
      setResponsibilities([...responsibilities, respInput.trim()]);
      setRespInput('');
    }
  };

  const removeResponsibility = (idx: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the Job Title and Description.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        department,
        location,
        employmentType,
        workMode,
        experienceLevel,
        minYearsExperience,
        salaryRange,
        openings,
        status,
        description,
        responsibilities,
        requiredSkills,
        preferredSkills,
        educationRequirements
      };

      const url = isEditing && jobToEdit ? `/api/jobs/${jobToEdit.id}` : '/api/jobs';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save job');
      }

      onSave();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving job');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Job Opening' : 'Create New Job Opening'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define role parameters and criteria for ATS candidate screening
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Product, Marketing"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Fresher">Fresher (0 yrs)</option>
                  <option value="0–1 years">0–1 years</option>
                  <option value="1–3 years">1–3 years</option>
                  <option value="3–5 years">3–5 years</option>
                  <option value="5–8 years">5–8 years</option>
                  <option value="8+ years">8+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Years Required
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={minYearsExperience}
                  onChange={(e) => setMinYearsExperience(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salary Range
                </label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="e.g. $130,000 - $160,000"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Openings
                </label>
                <input
                  type="number"
                  min="1"
                  value={openings}
                  onChange={(e) => setOpenings(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Job Description with AI Extraction */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Job Description
              </h3>
              <button
                type="button"
                onClick={handleExtractFromJD}
                disabled={isExtracting || !description.trim()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Extracting Criteria...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Auto-Extract Criteria with AI
                  </>
                )}
              </button>
            </div>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste complete Job Description here. You can click 'Auto-Extract Criteria with AI' to automatically parse out required skills, preferred skills, and responsibilities."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* Section 3: Structured Criteria */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Screening Criteria & Skill Weights
            </h3>

            {/* Required Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Skills (30% weight in ATS scoring)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequiredSkill(); } }}
                  placeholder="Add non-negotiable skill (e.g. Java, Spring Boot, SQL) and press Enter"
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addRequiredSkill}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => removeRequiredSkill(idx)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Skills (10% bonus weight in ATS scoring)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={prefInput}
                  onChange={(e) => setPrefInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPreferredSkill(); } }}
                  placeholder="Add nice-to-have skill (e.g. AWS, Docker, Kafka) and press Enter"
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addPreferredSkill}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preferredSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => removePreferredSkill(idx)}
                      className="text-emerald-400 hover:text-emerald-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Key Responsibilities (15% weight)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={respInput}
                  onChange={(e) => setRespInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addResponsibility(); } }}
                  placeholder="Add core job responsibility and press Enter"
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addResponsibility}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <div className="space-y-1.5">
                {responsibilities.map((resp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    <span>• {resp}</span>
                    <button
                      type="button"
                      onClick={() => removeResponsibility(idx)}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white font-medium"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || !title.trim() || !description.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {isEditing ? 'Save Changes' : 'Publish Job'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
