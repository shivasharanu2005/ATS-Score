# AI ATS — Smart Resume Screening & Candidate Ranking System

A production-grade recruitment SaaS web application designed for HR teams and recruiters to streamline talent screening, calculate explainable ATS match scores against custom job descriptions, identify matching vs. missing skills, and rank candidates objectively.

---

## 1. Core Workflow

```text
HR Registration/Login
        ↓
HR Dashboard
        ↓
Create Job & Define Criteria (Required/Preferred Skills, Experience, Responsibilities)
        ↓
Upload Candidate Resumes (PDF, DOCX, TXT)
        ↓
Text & Structured Information Extraction
        ↓
AI + ATS Multi-Factor Analysis
        ↓
Calculate Explainable 0–100 ATS Score with Resume Citations
        ↓
Rank Candidates (#1, #2, #3...)
        ↓
HR Review, Side-by-Side Comparison & Status Transitions (Shortlist / Interview / Reject)
```

---

## 2. Features

- **Multi-Format Resume Parser**: Ingests and extracts structured candidate data from PDF (`pdf-parse`), DOCX (`mammoth`), and raw TXT files.
- **Skill Normalization Layer**: Maps variations and synonyms to standardized canonical technologies (e.g. `JS` → `JavaScript`, `ReactJS` → `React`, `Postgres` → `PostgreSQL`, `K8s` → `Kubernetes`).
- **Explainable ATS Scoring Engine**:
  - Required Skills: **30%**
  - Relevant Experience: **20%**
  - Job Responsibilities: **15%**
  - Preferred Skills: **10%**
  - Projects Relevance: **10%**
  - Education Match: **5%**
  - Certifications: **5%**
  - Semantic Relevance: **5%**
  - *Weights are customizable per job or across organizational defaults.*
- **Responsible AI & Anti-Hallucination Guardrails**:
  - Strict distinction between *Found*, *Not Found*, and *Unclear*.
  - Direct quote citations for all matching claims.
  - Excludes protected demographic characteristics (race, gender, age, religion, marital status, photos).
- **Candidate Ranking & Filtering**: Sort by score, experience, or name; filter by minimum score brackets, status, and search keywords.
- **Side-by-Side Candidate Comparison**: Compare candidates for the same role side-by-side with dimensional score matrices.
- **Bulk HR Actions**: Select multiple candidates to shortlist, advance to interview, reject, or export to CSV.
- **Executive Recruitment Analytics**: Interactive score distribution charts, recruitment pipeline funnels, top applicant skills, and job-by-job metrics.
- **Deterministic ATS Fallback**: Uninterrupted functionality if external AI providers are offline or rate-limited.
- **Activity Audit Trail**: Immutable logging of all job creations, resume screening operations, and status changes.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Parsing**: `pdf-parse` (PDF extraction), `mammoth` (Word doc extraction), Multer (file handling).
- **AI Integration**: `@google/genai` with `gemini-3.8-flash`.
- **Database & Persistence**: Structured multi-tenant JSON database with atomic writes and rich pre-seeded data.

---

## 4. Default Demo Accounts

For immediate testing, use the built-in 1-click login buttons or credentials:

- **Recruiter**:
  - Email: `recruiter@apextalent.com`
  - Password: `password123`
- **HR Director**:
  - Email: `admin@apextalent.com`
  - Password: `admin123`

---

## 5. Local Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Run dev server (Express + Vite on port 3000)
npm run dev

# 3. Production build
npm run build
npm start
```
