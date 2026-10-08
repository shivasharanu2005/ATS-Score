export type EmploymentType = 'Full Time' | 'Part Time' | 'Contract' | 'Internship' | 'Freelance';
export type WorkMode = 'On-site' | 'Hybrid' | 'Remote';
export type ExperienceLevel = 'Fresher' | '0–1 years' | '1–3 years' | '3–5 years' | '5–8 years' | '8+ years';
export type CandidateStatus = 'New' | 'Screening' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected' | 'On Hold';

export interface ScoringWeights {
  requiredSkills: number;     // e.g. 30
  experience: number;         // e.g. 20
  responsibilities: number;   // e.g. 15
  preferredSkills: number;    // e.g. 10
  projects: number;           // e.g. 10
  education: number;          // e.g. 5
  certifications: number;     // e.g. 5
  relevance: number;          // e.g. 5
}

export interface Job {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  minYearsExperience: number;
  salaryRange: string;
  openings: number;
  status: 'Active' | 'Draft' | 'Closed';
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequirements: string[];
  scoringWeights?: ScoringWeights;
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
  avgAtsScore?: number;
}

export interface CandidateExperience {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  durationYears?: number;
  description?: string;
  technologies?: string[];
  isRelevant?: boolean;
}

export interface CandidateEducation {
  degree: string;
  field?: string;
  institution: string;
  graduationYear?: string;
  isRelevant?: boolean;
}

export interface CandidateProject {
  title: string;
  description: string;
  technologies: string[];
  relevanceScore?: number;
}

export interface SkillEvidence {
  skill: string;
  status: 'matched' | 'missing' | 'partial';
  source: string; // Quote or context from resume
  confidence: number;
}

export interface ScoreBreakdown {
  requiredSkills: { score: number; max: number; matched: string[]; missing: string[]; partial: string[] };
  experience: { score: number; max: number; candidateYears: number; requiredYears: number; matchLevel: 'Strong' | 'Moderate' | 'Weak' };
  responsibilities: { score: number; max: number; alignment: string };
  preferredSkills: { score: number; max: number; matched: string[]; missing: string[] };
  projects: { score: number; max: number; relevantCount: number };
  education: { score: number; max: number; matchLevel: 'Strong' | 'Moderate' | 'Weak'; degree: string };
  certifications: { score: number; max: number; items: string[] };
  relevance: { score: number; max: number; semanticScore: number };
}

export interface ResumeAnalysis {
  id: string;
  applicationId: string;
  overallScore: number;
  breakdown: ScoreBreakdown;
  aiSummary: string;
  recommendation: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Weak Match';
  strengths: string[];
  gaps: string[];
  whyThisScore: {
    positives: string[];
    negatives: string[];
  };
  skillEvidences: SkillEvidence[];
  isAiGenerated: boolean;
  analyzedAt: string;
}

export interface Candidate {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
  skills: string[];
  totalExperienceYears: number;
  experienceTimeline: CandidateExperience[];
  education: CandidateEducation[];
  projects: CandidateProject[];
  certifications: string[];
  languages: string[];
  originalResumeText: string;
  originalFileName: string;
  fileHash?: string;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  status: CandidateStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  candidate: Candidate;
  jobTitle?: string;
  jobDepartment?: string;
  atsScore: number;
  status: CandidateStatus;
  statusHistory: StatusHistoryItem[];
  appliedDate: string;
  analysis?: ResumeAnalysis;
  interviewDate?: string;
  notes?: string;
}

export interface User {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  email: string;
  role: 'Admin' | 'Recruiter' | 'Hiring Manager';
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details: string;
}
