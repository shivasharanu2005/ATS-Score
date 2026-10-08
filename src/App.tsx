import React, { useState, useEffect } from 'react';
import {
  Briefcase, Users, LayoutDashboard, BarChart3, Settings,
  Plus, Upload, Sparkles, ArrowRight, Eye, CheckCircle2
} from 'lucide-react';
import { Job, Application, User, CandidateStatus } from './types/ats';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { StatCards } from './components/dashboard/StatCards';
import { ScoreDistributionChart } from './components/dashboard/ScoreDistributionChart';
import { CandidateTable } from './components/candidates/CandidateTable';
import { CandidateDetailModal } from './components/candidates/CandidateDetailModal';
import { CandidateComparisonModal } from './components/candidates/CandidateComparisonModal';
import { JobModal } from './components/jobs/JobModal';
import { ResumeUploaderModal } from './components/resume/ResumeUploaderModal';
import { JobsView } from './components/jobs/JobsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { CircularScore } from './components/ui/CircularScore';
import { StatusBadge } from './components/ui/StatusBadge';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ats_token'));
  const [showLanding, setShowLanding] = useState<boolean>(!localStorage.getItem('ats_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Nav state
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'analytics' | 'settings'>('dashboard');

  // Core Data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(undefined);

  // Modals
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetJob, setUploadTargetJob] = useState<Job | null>(null);
  const [selectedCandidateApp, setSelectedCandidateApp] = useState<Application | null>(null);
  const [comparingApps, setComparingApps] = useState<Application[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, selectedJobId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Fallback default recruiter user for easy prototype preview
        setUser({
          id: 'usr-recruiter-01',
          organizationId: 'org-apex-talent-001',
          organizationName: 'Apex Talent Technologies',
          name: 'Sarah Jenkins',
          email: 'recruiter@apextalent.com',
          role: 'Recruiter'
        });
      }
    } catch {
      setUser({
        id: 'usr-recruiter-01',
        organizationId: 'org-apex-talent-001',
        organizationName: 'Apex Talent Technologies',
        name: 'Sarah Jenkins',
        email: 'recruiter@apextalent.com',
        role: 'Recruiter'
      });
    }
  };

  const loadAllData = async () => {
    try {
      // Load Jobs
      const jobsRes = await fetch('/api/jobs');
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs || []);

      // Load Applications
      const targetJob = selectedJobId || jobsData.jobs?.[0]?.id;
      const appsUrl = targetJob ? `/api/jobs/${targetJob}/candidates` : '/api/analytics';
      
      const appsRes = await fetch(targetJob ? `/api/jobs/${targetJob}/candidates` : '/api/jobs');
      if (targetJob) {
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
      }

      // Load Analytics
      const anaRes = await fetch('/api/analytics');
      const anaData = await anaRes.json();
      setAnalyticsData(anaData);

      // If no candidate list loaded yet, populate from recent applications in analytics
      if (!targetJob && anaData.recentApplications) {
        setApplications(anaData.recentApplications);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleLoginSuccess = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('ats_token', newToken);
    setShowLanding(false);
    showToast(`Welcome, ${newUser.name}!`);
    loadAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('ats_token');
    setToken(null);
    setShowLanding(true);
  };

  const handleStatusChange = async (appId: string, newStatus: CandidateStatus, note?: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note })
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications(prev =>
          prev.map(a => (a.id === appId ? { ...a, status: newStatus } : a))
        );
        if (selectedCandidateApp && selectedCandidateApp.id === appId) {
          setSelectedCandidateApp(prev => prev ? { ...prev, status: newStatus } : null);
        }
        showToast(`Candidate status updated to "${newStatus}"`);
        // Refresh analytics
        const anaRes = await fetch('/api/analytics');
        const anaData = await anaRes.json();
        setAnalyticsData(anaData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkStatusChange = async (appIds: string[], status: CandidateStatus) => {
    try {
      const res = await fetch('/api/applications/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds: appIds, status })
      });
      if (res.ok) {
        setApplications(prev =>
          prev.map(a => (appIds.includes(a.id) ? { ...a, status } : a))
        );
        showToast(`Bulk updated ${appIds.length} candidate(s) to "${status}"`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReanalyze = async (appId: string) => {
    try {
      showToast('Re-analyzing candidate against current criteria...');
      const res = await fetch(`/api/applications/${appId}/reanalyze`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setApplications(prev =>
          prev.map(a => (a.id === appId ? data.application : a))
        );
        if (selectedCandidateApp && selectedCandidateApp.id === appId) {
          setSelectedCandidateApp(data.application);
        }
        showToast(`Re-analysis complete! New ATS Score: ${data.application.atsScore}%`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJobId === jobId) setSelectedJobId(undefined);
        showToast('Job opening deleted');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If user requests public landing page
  if (showLanding) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setShowLanding(false);
            if (!user) fetchCurrentUser();
          }}
          onOpenLogin={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // Active Job for screening context
  const activeJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Main Navbar */}
      {user && (
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          user={user}
          onLogout={handleLogout}
          onOpenCreateJob={() => { setEditingJob(null); setIsJobModalOpen(true); }}
          onOpenUpload={() => {
            setUploadTargetJob(activeJob || null);
            setIsUploadModalOpen(true);
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Recruitment Dashboard
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time ATS screening metrics, candidate rankings, and applicant pipeline
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowLanding(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors border border-slate-200"
                >
                  View Landing Page
                </button>
                <button
                  onClick={() => {
                    setUploadTargetJob(activeJob || null);
                    setIsUploadModalOpen(true);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Screen Resumes
                </button>
              </div>
            </div>

            {/* Top Stat Cards */}
            {analyticsData?.metrics && (
              <StatCards metrics={analyticsData.metrics} />
            )}

            {/* Score Distribution Chart & Funnel */}
            {analyticsData?.scoreDistribution && (
              <ScoreDistributionChart
                distribution={analyticsData.scoreDistribution}
                funnel={analyticsData.funnel}
              />
            )}

            {/* Job Selector + Candidate Ranking preview */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Candidate Rankings ({applications.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Active Role: <span className="font-semibold text-indigo-700">{activeJob?.title || 'All Jobs'}</span>
                  </p>
                </div>

                {jobs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Screening For:</label>
                    <select
                      value={selectedJobId || activeJob?.id || ''}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
                    >
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Table */}
              <CandidateTable
                applications={applications}
                onSelectCandidate={(app) => setSelectedCandidateApp(app)}
                onStatusChange={handleStatusChange}
                onBulkStatusChange={handleBulkStatusChange}
                onCompare={(apps) => setComparingApps(apps)}
                onOpenUpload={() => {
                  setUploadTargetJob(activeJob || null);
                  setIsUploadModalOpen(true);
                }}
                selectedJobId={activeJob?.id}
              />
            </div>
          </div>
        )}

        {/* JOBS TAB */}
        {currentTab === 'jobs' && (
          <JobsView
            jobs={jobs}
            onOpenCreateJob={() => { setEditingJob(null); setIsJobModalOpen(true); }}
            onEditJob={(job) => { setEditingJob(job); setIsJobModalOpen(true); }}
            onDeleteJob={handleDeleteJob}
            onSelectJobForCandidates={(jobId) => {
              setSelectedJobId(jobId);
              setCurrentTab('candidates');
            }}
            onOpenUploadForJob={(job) => {
              setUploadTargetJob(job);
              setIsUploadModalOpen(true);
            }}
          />
        )}

        {/* CANDIDATES TAB */}
        {currentTab === 'candidates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Candidate Talent Pool
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked by multi-factor ATS match score with explainable criteria breakdown
                </p>
              </div>

              <div className="flex items-center gap-3">
                {jobs.length > 0 && (
                  <select
                    value={selectedJobId || ''}
                    onChange={(e) => setSelectedJobId(e.target.value || undefined)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="">Filter by Job Opening...</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => {
                    setUploadTargetJob(activeJob || null);
                    setIsUploadModalOpen(true);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Resumes
                </button>
              </div>
            </div>

            <CandidateTable
              applications={applications}
              onSelectCandidate={(app) => setSelectedCandidateApp(app)}
              onStatusChange={handleStatusChange}
              onBulkStatusChange={handleBulkStatusChange}
              onCompare={(apps) => setComparingApps(apps)}
              onOpenUpload={() => {
                setUploadTargetJob(activeJob || null);
                setIsUploadModalOpen(true);
              }}
              selectedJobId={selectedJobId}
            />
          </div>
        )}

        {/* ANALYTICS TAB */}
        {currentTab === 'analytics' && analyticsData && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Recruitment & ATS Analytics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Conversion rates, score distribution brackets, and applicant pool proficiencies
              </p>
            </div>
            <AnalyticsView data={analyticsData} />
          </div>
        )}

        {/* SETTINGS TAB */}
        {currentTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                ATS Settings & Preferences
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure scoring criteria weights, view compliance policies, and audit logs
              </p>
            </div>
            <SettingsView onWeightsUpdated={() => showToast('ATS weights updated successfully')} />
          </div>
        )}
      </main>

      {/* Modals */}
      {isJobModalOpen && (
        <JobModal
          jobToEdit={editingJob}
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          onSave={() => {
            showToast(editingJob ? 'Job updated successfully' : 'Job created successfully');
            loadAllData();
          }}
        />
      )}

      {isUploadModalOpen && uploadTargetJob && (
        <ResumeUploaderModal
          job={uploadTargetJob}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            showToast('Resumes uploaded and screened!');
            loadAllData();
          }}
        />
      )}

      {selectedCandidateApp && (
        <CandidateDetailModal
          application={selectedCandidateApp}
          isOpen={Boolean(selectedCandidateApp)}
          onClose={() => setSelectedCandidateApp(null)}
          onStatusChange={handleStatusChange}
          onReanalyze={handleReanalyze}
        />
      )}

      {comparingApps.length > 0 && (
        <CandidateComparisonModal
          applications={comparingApps}
          isOpen={comparingApps.length > 0}
          onClose={() => setComparingApps([])}
          onSelectCandidate={(app) => {
            setComparingApps([]);
            setSelectedCandidateApp(app);
          }}
        />
      )}
    </div>
  );
}

export default App;
