import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { db } from './server/db/database';
import { extractTextFromBuffer, computeFileHash, parseResumeText } from './server/services/resumeParser';
import { analyzeJobDescription } from './server/services/jobAnalyzer';
import { analyzeResumeForJob, DEFAULT_SCORING_WEIGHTS } from './server/services/ats/atsEngine';
import { Job, Candidate, Application, CandidateStatus, AuditLog } from './src/types/ats';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer in-memory storage for uploaded files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.txt', '.doc'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, DOCX, or TXT documents.'));
    }
  }
});

// Simple Session Token mapping for demo auth
const sessions = new Map<string, { userId: string; orgId: string; email: string }>();

// Helper auth middleware
function getAuthUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = sessions.get(token);
    if (session) {
      const user = db.getUsers().find(u => u.id === session.userId);
      if (user) return user;
    }
  }
  // Default to demo recruiter if no token passed (seamless preview access)
  const defaultRecruiter = db.getUsers().find(u => u.email === 'recruiter@apextalent.com');
  return defaultRecruiter || db.getUsers()[0];
}

/* =========================================================================
   AUTHENTICATION ROUTES
========================================================================= */

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = `tok_${user.id}_${Date.now()}`;
  sessions.set(token, { userId: user.id, orgId: user.organizationId, email: user.email });

  const { passwordHash, ...userClean } = user;
  return res.json({ token, user: userClean });
});

app.post('/api/auth/register', (req, res) => {
  const { name, companyName, email, password } = req.body;
  if (!name || !email || !password || !companyName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existing = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const orgId = `org_${Date.now()}`;
  db.getOrganizations().push({
    id: orgId,
    name: companyName,
    domain: email.split('@')[1] || 'company.com',
    createdAt: new Date().toISOString()
  });

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: `usr_${Date.now()}`,
    organizationId: orgId,
    organizationName: companyName,
    name,
    email,
    role: 'Admin' as const,
    passwordHash
  };

  db.getUsers().push(newUser);

  const token = `tok_${newUser.id}_${Date.now()}`;
  sessions.set(token, { userId: newUser.id, orgId, email: newUser.email });

  const { passwordHash: _, ...clean } = newUser;
  return res.json({ token, user: clean });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { passwordHash, ...clean } = user;
  return res.json({ user: clean });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessions.delete(authHeader.substring(7));
  }
  return res.json({ success: true });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  return res.json({ message: `Password reset instructions sent to ${email || 'your email'}` });
});

/* =========================================================================
   JOB MANAGEMENT ROUTES
========================================================================= */

app.get('/api/jobs', (req, res) => {
  const user = getAuthUser(req);
  const jobs = db.getJobs(user.organizationId);
  return res.json({ jobs });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json({ job });
});

app.post('/api/jobs', (req, res) => {
  const user = getAuthUser(req);
  const {
    title,
    department,
    location,
    employmentType,
    workMode,
    experienceLevel,
    minYearsExperience,
    salaryRange,
    openings,
    description,
    responsibilities,
    requiredSkills,
    preferredSkills,
    educationRequirements,
    scoringWeights,
    status
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Job title and description are required' });
  }

  const newJob: Job = {
    id: `job-${Date.now()}`,
    organizationId: user.organizationId,
    title,
    department: department || 'Engineering',
    location: location || 'Remote',
    employmentType: employmentType || 'Full Time',
    workMode: workMode || 'Remote',
    experienceLevel: experienceLevel || '3–5 years',
    minYearsExperience: Number(minYearsExperience) || 3,
    salaryRange: salaryRange || 'Competitive',
    openings: Number(openings) || 1,
    status: status || 'Active',
    description,
    responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
    educationRequirements: Array.isArray(educationRequirements) ? educationRequirements : ["Bachelor's degree in related field"],
    scoringWeights: scoringWeights || DEFAULT_SCORING_WEIGHTS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.createJob(newJob);

  db.addAuditLog({
    id: `log-${Date.now()}`,
    organizationId: user.organizationId,
    userId: user.id,
    userName: user.name,
    action: 'Job Created',
    entity: 'Job',
    entityId: newJob.id,
    timestamp: new Date().toISOString(),
    details: `Created job: "${newJob.title}"`
  });

  return res.status(201).json({ job: newJob });
});

app.put('/api/jobs/:id', (req, res) => {
  const user = getAuthUser(req);
  const updated = db.updateJob(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Job not found' });

  db.addAuditLog({
    id: `log-${Date.now()}`,
    organizationId: user.organizationId,
    userId: user.id,
    userName: user.name,
    action: 'Job Updated',
    entity: 'Job',
    entityId: updated.id,
    timestamp: new Date().toISOString(),
    details: `Updated job requirements for "${updated.title}"`
  });

  return res.json({ job: updated });
});

app.delete('/api/jobs/:id', (req, res) => {
  const user = getAuthUser(req);
  const job = db.getJobById(req.params.id);
  const success = db.deleteJob(req.params.id);
  if (!success) return res.status(404).json({ error: 'Job not found' });

  db.addAuditLog({
    id: `log-${Date.now()}`,
    organizationId: user.organizationId,
    userId: user.id,
    userName: user.name,
    action: 'Job Deleted',
    entity: 'Job',
    entityId: req.params.id,
    timestamp: new Date().toISOString(),
    details: `Deleted job "${job?.title || req.params.id}"`
  });

  return res.json({ success: true });
});

app.post('/api/jobs/analyze-jd', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ error: 'Job description text is required' });
    const extracted = await analyzeJobDescription(rawText);
    return res.json({ requirements: extracted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to extract requirements' });
  }
});

/* =========================================================================
   RESUME UPLOAD & ATS SCREENING ROUTES
========================================================================= */

app.post('/api/jobs/:id/upload', upload.array('resumes', 25), async (req, res) => {
  const user = getAuthUser(req);
  const jobId = req.params.id;
  const job = db.getJobById(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No resume files were uploaded' });
  }

  const processedResults: Array<{
    fileName: string;
    candidateName: string;
    atsScore: number;
    status: string;
    isDuplicate: boolean;
    error?: string;
  }> = [];

  for (const file of files) {
    try {
      const fileHash = computeFileHash(file.buffer);

      // Check for duplicate resume
      const existingCand = db.findCandidateByHash(user.organizationId, fileHash);
      if (existingCand) {
        // Candidate already exists. Check if application for this job exists
        const existingApp = db.getApplications(jobId).find(a => a.candidateId === existingCand.id);
        if (existingApp) {
          processedResults.push({
            fileName: file.originalname,
            candidateName: existingCand.name,
            atsScore: existingApp.atsScore,
            status: existingApp.status,
            isDuplicate: true,
            error: 'Duplicate resume already screened for this job.'
          });
          continue;
        }
      }

      // Extract raw text
      const rawText = await extractTextFromBuffer(file.buffer, file.originalname, file.mimetype);
      if (!rawText || rawText.trim().length < 20) {
        processedResults.push({
          fileName: file.originalname,
          candidateName: 'Unknown',
          atsScore: 0,
          status: 'Failed',
          isDuplicate: false,
          error: 'Could not extract readable text from document.'
        });
        continue;
      }

      // Parse structured candidate info
      const parsed = parseResumeText(rawText, file.originalname, fileHash);

      // Create or reuse candidate
      let candidate: Candidate;
      if (existingCand) {
        candidate = existingCand;
      } else {
        candidate = {
          id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          organizationId: user.organizationId,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          location: parsed.location,
          linkedin: parsed.linkedin,
          github: parsed.github,
          portfolio: parsed.portfolio,
          summary: parsed.summary,
          skills: parsed.skills,
          totalExperienceYears: parsed.totalExperienceYears,
          experienceTimeline: parsed.experienceTimeline,
          education: parsed.education,
          projects: parsed.projects,
          certifications: parsed.certifications,
          languages: parsed.languages,
          originalResumeText: rawText,
          originalFileName: file.originalname,
          fileHash,
          createdAt: new Date().toISOString()
        };
        db.createCandidate(candidate);
      }

      // Run ATS Analysis
      const analysis = await analyzeResumeForJob(candidate, job, job.scoringWeights || DEFAULT_SCORING_WEIGHTS);

      const newApp: Application = {
        id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        candidateId: candidate.id,
        jobId: job.id,
        candidate,
        jobTitle: job.title,
        jobDepartment: job.department,
        atsScore: analysis.overallScore,
        status: 'New',
        statusHistory: [
          {
            id: `sh-${Date.now()}`,
            status: 'New',
            changedBy: user.name,
            changedAt: new Date().toISOString(),
            note: `Parsed ${file.originalname} and calculated ATS score.`
          }
        ],
        appliedDate: new Date().toISOString(),
        analysis: {
          ...analysis,
          applicationId: ''
        }
      };

      if (newApp.analysis) {
        newApp.analysis.applicationId = newApp.id;
      }

      db.createApplication(newApp);

      db.addAuditLog({
        id: `log-${Date.now()}`,
        organizationId: user.organizationId,
        userId: user.id,
        userName: user.name,
        action: 'Resume Uploaded & Analyzed',
        entity: 'Application',
        entityId: newApp.id,
        timestamp: new Date().toISOString(),
        details: `Screened resume ${file.originalname} for ${candidate.name} (Score: ${analysis.overallScore}%)`
      });

      processedResults.push({
        fileName: file.originalname,
        candidateName: candidate.name,
        atsScore: analysis.overallScore,
        status: 'Success',
        isDuplicate: false
      });
    } catch (err: any) {
      console.error(`Error processing resume ${file.originalname}:`, err);
      processedResults.push({
        fileName: file.originalname,
        candidateName: 'Unknown',
        atsScore: 0,
        status: 'Failed',
        isDuplicate: false,
        error: err.message || 'Processing error'
      });
    }
  }

  return res.json({
    message: `Processed ${files.length} resume(s)`,
    results: processedResults
  });
});

// Direct text paste resume endpoint
app.post('/api/jobs/:id/paste-resume', async (req, res) => {
  const user = getAuthUser(req);
  const jobId = req.params.id;
  const job = db.getJobById(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { resumeText, fileName } = req.body;
  if (!resumeText || resumeText.trim().length < 20) {
    return res.status(400).json({ error: 'Resume text is required and must contain at least 20 characters' });
  }

  const fName = fileName || 'Pasted_Resume.txt';
  const fileHash = computeFileHash(Buffer.from(resumeText, 'utf-8'));
  const parsed = parseResumeText(resumeText, fName, fileHash);

  const candidate: Candidate = {
    id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    organizationId: user.organizationId,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    location: parsed.location,
    linkedin: parsed.linkedin,
    github: parsed.github,
    portfolio: parsed.portfolio,
    summary: parsed.summary,
    skills: parsed.skills,
    totalExperienceYears: parsed.totalExperienceYears,
    experienceTimeline: parsed.experienceTimeline,
    education: parsed.education,
    projects: parsed.projects,
    certifications: parsed.certifications,
    languages: parsed.languages,
    originalResumeText: resumeText,
    originalFileName: fName,
    fileHash,
    createdAt: new Date().toISOString()
  };

  db.createCandidate(candidate);

  const analysis = await analyzeResumeForJob(candidate, job, job.scoringWeights || DEFAULT_SCORING_WEIGHTS);

  const newApp: Application = {
    id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    candidateId: candidate.id,
    jobId: job.id,
    candidate,
    jobTitle: job.title,
    jobDepartment: job.department,
    atsScore: analysis.overallScore,
    status: 'New',
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        status: 'New',
        changedBy: user.name,
        changedAt: new Date().toISOString(),
        note: `Screened pasted resume.`
      }
    ],
    appliedDate: new Date().toISOString(),
    analysis: {
      ...analysis,
      applicationId: ''
    }
  };

  if (newApp.analysis) {
    newApp.analysis.applicationId = newApp.id;
  }

  db.createApplication(newApp);

  return res.json({ application: newApp });
});

/* =========================================================================
   CANDIDATE & APPLICATION QUERY ROUTES
========================================================================= */

app.get('/api/jobs/:id/candidates', (req, res) => {
  const user = getAuthUser(req);
  const jobId = req.params.id;
  let apps = db.getApplications(jobId, user.organizationId);

  // Filters
  const { minScore, status, search, sortBy, sortOrder } = req.query;

  if (minScore) {
    apps = apps.filter(a => a.atsScore >= Number(minScore));
  }

  if (status && status !== 'All') {
    apps = apps.filter(a => a.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    apps = apps.filter(a =>
      a.candidate.name.toLowerCase().includes(q) ||
      a.candidate.email.toLowerCase().includes(q) ||
      a.candidate.skills.some(s => s.toLowerCase().includes(q))
    );
  }

  // Sorting
  const sort = (sortBy as string) || 'score';
  const order = (sortOrder as string) === 'asc' ? 1 : -1;

  apps.sort((a, b) => {
    if (sort === 'score') return (a.atsScore - b.atsScore) * order;
    if (sort === 'name') return a.candidate.name.localeCompare(b.candidate.name) * order;
    if (sort === 'experience') return (a.candidate.totalExperienceYears - b.candidate.totalExperienceYears) * order;
    if (sort === 'date') return (new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime()) * order;
    return (a.atsScore - b.atsScore) * order;
  });

  return res.json({ applications: apps, total: apps.length });
});

app.get('/api/applications/:id', (req, res) => {
  const appItem = db.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });
  return res.json({ application: appItem });
});

app.get('/api/candidates/:id', (req, res) => {
  const cand = db.getCandidateById(req.params.id);
  if (!cand) return res.status(404).json({ error: 'Candidate not found' });
  const applications = db.getApplications().filter(a => a.candidateId === cand.id);
  return res.json({ candidate: cand, applications });
});

// Update application status
app.patch('/api/applications/:id/status', (req, res) => {
  const user = getAuthUser(req);
  const { status, note, interviewDate } = req.body;
  const appItem = db.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const oldStatus = appItem.status;
  const newHistoryItem = {
    id: `sh-${Date.now()}`,
    status: status as CandidateStatus,
    changedBy: user.name,
    changedAt: new Date().toISOString(),
    note: note || `Status updated from ${oldStatus} to ${status}`
  };

  const updated = db.updateApplication(req.params.id, {
    status,
    interviewDate: interviewDate || appItem.interviewDate,
    statusHistory: [newHistoryItem, ...(appItem.statusHistory || [])]
  });

  db.addAuditLog({
    id: `log-${Date.now()}`,
    organizationId: user.organizationId,
    userId: user.id,
    userName: user.name,
    action: 'Candidate Status Changed',
    entity: 'Application',
    entityId: appItem.id,
    timestamp: new Date().toISOString(),
    details: `Updated ${appItem.candidate.name} from "${oldStatus}" to "${status}"`
  });

  return res.json({ application: updated });
});

// Bulk status updates
app.post('/api/applications/bulk-status', (req, res) => {
  const user = getAuthUser(req);
  const { applicationIds, status, note } = req.body;
  if (!Array.isArray(applicationIds) || !status) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  let count = 0;
  for (const id of applicationIds) {
    const appItem = db.getApplicationById(id);
    if (appItem) {
      db.updateApplication(id, {
        status,
        statusHistory: [
          {
            id: `sh-${Date.now()}`,
            status,
            changedBy: user.name,
            changedAt: new Date().toISOString(),
            note: note || `Bulk status update to ${status}`
          },
          ...(appItem.statusHistory || [])
        ]
      });
      count++;
    }
  }

  db.addAuditLog({
    id: `log-${Date.now()}`,
    organizationId: user.organizationId,
    userId: user.id,
    userName: user.name,
    action: 'Bulk Status Update',
    entity: 'Application',
    entityId: applicationIds.join(','),
    timestamp: new Date().toISOString(),
    details: `Updated ${count} candidate(s) to "${status}"`
  });

  return res.json({ success: true, updatedCount: count });
});

// Re-analyze application
app.post('/api/applications/:id/reanalyze', async (req, res) => {
  const user = getAuthUser(req);
  const appItem = db.getApplicationById(req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const job = db.getJobById(appItem.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const analysis = await analyzeResumeForJob(appItem.candidate, job, job.scoringWeights || DEFAULT_SCORING_WEIGHTS);
  analysis.applicationId = appItem.id;

  const updated = db.updateApplication(appItem.id, {
    atsScore: analysis.overallScore,
    analysis
  });

  db.addAuditLog({
    id: `log-${Date.now()}`,
    organizationId: user.organizationId,
    userId: user.id,
    userName: user.name,
    action: 'Re-analyzed Candidate',
    entity: 'Application',
    entityId: appItem.id,
    timestamp: new Date().toISOString(),
    details: `Recalculated ATS score for ${appItem.candidate.name}: ${analysis.overallScore}%`
  });

  return res.json({ application: updated });
});

// Compare multiple applications
app.get('/api/applications/compare', (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean);
  const apps = ids.map(id => db.getApplicationById(id)).filter(Boolean);
  return res.json({ applications: apps });
});

/* =========================================================================
   ANALYTICS & METRICS ROUTES
========================================================================= */

app.get('/api/analytics', (req, res) => {
  const user = getAuthUser(req);
  const jobs = db.getJobs(user.organizationId);
  const apps = db.getApplications(undefined, user.organizationId);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.status === 'Active').length;
  const totalCandidates = apps.length;
  const shortlisted = apps.filter(a => a.status === 'Shortlisted').length;
  const interviews = apps.filter(a => a.status === 'Interview').length;
  const selected = apps.filter(a => a.status === 'Selected').length;
  const rejected = apps.filter(a => a.status === 'Rejected').length;

  const avgScore = totalCandidates > 0
    ? Math.round(apps.reduce((sum, a) => sum + a.atsScore, 0) / totalCandidates)
    : 0;

  // Score distribution brackets: 90-100, 80-89, 70-79, 60-69, Below 60
  const scoreDistribution = [
    { range: '90–100', count: apps.filter(a => a.atsScore >= 90).length, fill: '#10b981' },
    { range: '80–89', count: apps.filter(a => a.atsScore >= 80 && a.atsScore < 90).length, fill: '#3b82f6' },
    { range: '70–79', count: apps.filter(a => a.atsScore >= 70 && a.atsScore < 80).length, fill: '#6366f1' },
    { range: '60–69', count: apps.filter(a => a.atsScore >= 60 && a.atsScore < 70).length, fill: '#f59e0b' },
    { range: 'Below 60', count: apps.filter(a => a.atsScore < 60).length, fill: '#ef4444' }
  ];

  // Pipeline funnel
  const funnel = [
    { stage: 'Screened', count: totalCandidates, color: '#6366f1' },
    { stage: 'Shortlisted', count: shortlisted, color: '#3b82f6' },
    { stage: 'Interview', count: interviews, color: '#8b5cf6' },
    { stage: 'Selected', count: selected, color: '#10b981' }
  ];

  // Top candidate skills frequency
  const skillFreq: Record<string, number> = {};
  for (const a of apps) {
    for (const sk of a.candidate.skills) {
      skillFreq[sk] = (skillFreq[sk] || 0) + 1;
    }
  }

  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  return res.json({
    metrics: {
      totalJobs,
      activeJobs,
      totalCandidates,
      shortlisted,
      interviews,
      selected,
      rejected,
      avgScore,
      shortlistRate: totalCandidates ? Math.round((shortlisted / totalCandidates) * 100) : 0,
      interviewRate: totalCandidates ? Math.round((interviews / totalCandidates) * 100) : 0,
      selectionRate: totalCandidates ? Math.round((selected / totalCandidates) * 100) : 0
    },
    scoreDistribution,
    funnel,
    topSkills,
    recentJobs: jobs.slice(0, 5),
    recentApplications: apps.slice(0, 8)
  });
});

/* =========================================================================
   SETTINGS, AUDIT & EXPORT ROUTES
========================================================================= */

app.get('/api/settings', (req, res) => {
  const user = getAuthUser(req);
  return res.json({ settings: db.getSettings(user.organizationId) });
});

app.put('/api/settings', (req, res) => {
  const user = getAuthUser(req);
  const updated = db.updateSettings(user.organizationId, req.body);
  return res.json({ settings: updated });
});

app.get('/api/audit-logs', (req, res) => {
  const user = getAuthUser(req);
  return res.json({ logs: db.getAuditLogs(user.organizationId) });
});

app.post('/api/seed', (req, res) => {
  db.reseed();
  return res.json({ message: 'Database reset to demo seed data' });
});

app.get('/api/export', (req, res) => {
  const user = getAuthUser(req);
  const jobId = req.query.jobId as string;
  const apps = db.getApplications(jobId, user.organizationId);

  // Return CSV format
  const headers = ['Candidate', 'Email', 'Phone', 'Job Title', 'ATS Score', 'Experience (Yrs)', 'Status', 'Applied Date'];
  const rows = apps.map(a => [
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
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="candidates_export.csv"');
  return res.send(csv);
});

/* =========================================================================
   FRONTEND VITE INTEGRATION
========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI ATS platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
