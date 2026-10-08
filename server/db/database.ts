import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Job, Candidate, Application, User, AuditLog, ScoringWeights, ResumeAnalysis } from '../../src/types/ats';
import { DEFAULT_SCORING_WEIGHTS } from '../services/ats/atsEngine';

interface DatabaseSchema {
  organizations: Array<{ id: string; name: string; domain: string; createdAt: string }>;
  users: Array<User & { passwordHash: string }>;
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  auditLogs: AuditLog[];
  settings: Record<string, { scoringWeights: ScoringWeights; defaultStatus: string }>;
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'ats_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrCreate();
  }

  private loadOrCreate(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed reading existing db file, will reseed:', err);
    }

    const seeded = this.createSeedData();
    this.saveData(seeded);
    return seeded;
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public getOrganizations() { return this.data.organizations; }
  public getUsers() { return this.data.users; }
  public getJobs(orgId?: string) {
    let jobs = this.data.jobs;
    if (orgId) jobs = jobs.filter(j => j.organizationId === orgId);
    return jobs.map(j => {
      const apps = this.data.applications.filter(a => a.jobId === j.id);
      const avgScore = apps.length > 0
        ? Math.round(apps.reduce((sum, a) => sum + a.atsScore, 0) / apps.length)
        : 0;
      return {
        ...j,
        candidateCount: apps.length,
        avgAtsScore: avgScore
      };
    });
  }

  public getJobById(id: string) {
    const job = this.data.jobs.find(j => j.id === id);
    if (!job) return null;
    const apps = this.data.applications.filter(a => a.jobId === job.id);
    const avgScore = apps.length > 0
      ? Math.round(apps.reduce((sum, a) => sum + a.atsScore, 0) / apps.length)
      : 0;
    return {
      ...job,
      candidateCount: apps.length,
      avgAtsScore: avgScore
    };
  }

  public createJob(job: Job) {
    this.data.jobs.unshift(job);
    this.saveData();
    return job;
  }

  public updateJob(id: string, updates: Partial<Job>) {
    const idx = this.data.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    this.data.jobs[idx] = { ...this.data.jobs[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveData();
    return this.data.jobs[idx];
  }

  public deleteJob(id: string) {
    const idx = this.data.jobs.findIndex(j => j.id === id);
    if (idx === -1) return false;
    this.data.jobs.splice(idx, 1);
    this.data.applications = this.data.applications.filter(a => a.jobId !== id);
    this.saveData();
    return true;
  }

  public getCandidates(orgId?: string) {
    if (orgId) return this.data.candidates.filter(c => c.organizationId === orgId);
    return this.data.candidates;
  }

  public getCandidateById(id: string) {
    return this.data.candidates.find(c => c.id === id) || null;
  }

  public findCandidateByHash(orgId: string, hash: string) {
    return this.data.candidates.find(c => c.organizationId === orgId && c.fileHash === hash);
  }

  public findCandidateByEmail(orgId: string, email: string) {
    return this.data.candidates.find(c => c.organizationId === orgId && c.email.toLowerCase() === email.toLowerCase());
  }

  public createCandidate(candidate: Candidate) {
    this.data.candidates.unshift(candidate);
    this.saveData();
    return candidate;
  }

  public getApplications(jobId?: string, orgId?: string) {
    let apps = this.data.applications;
    if (jobId) {
      apps = apps.filter(a => a.jobId === jobId);
    }
    if (orgId) {
      apps = apps.filter(a => a.candidate.organizationId === orgId);
    }
    // enrich candidate and job info
    return apps.map(a => {
      const cand = this.data.candidates.find(c => c.id === a.candidateId) || a.candidate;
      const job = this.data.jobs.find(j => j.id === a.jobId);
      return {
        ...a,
        candidate: cand,
        jobTitle: job?.title || a.jobTitle,
        jobDepartment: job?.department || a.jobDepartment
      };
    });
  }

  public getApplicationById(id: string) {
    const app = this.data.applications.find(a => a.id === id);
    if (!app) return null;
    const cand = this.data.candidates.find(c => c.id === app.candidateId) || app.candidate;
    const job = this.data.jobs.find(j => j.id === app.jobId);
    return {
      ...app,
      candidate: cand,
      jobTitle: job?.title || app.jobTitle,
      jobDepartment: job?.department || app.jobDepartment
    };
  }

  public createApplication(app: Application) {
    this.data.applications.unshift(app);
    this.saveData();
    return app;
  }

  public updateApplication(id: string, updates: Partial<Application>) {
    const idx = this.data.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.applications[idx] = { ...this.data.applications[idx], ...updates };
    this.saveData();
    return this.data.applications[idx];
  }

  public deleteApplication(id: string) {
    const idx = this.data.applications.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.applications.splice(idx, 1);
    this.saveData();
    return true;
  }

  public addAuditLog(log: AuditLog) {
    this.data.auditLogs.unshift(log);
    // keep recent 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.saveData();
  }

  public getAuditLogs(orgId?: string) {
    if (orgId) return this.data.auditLogs.filter(l => l.organizationId === orgId);
    return this.data.auditLogs;
  }

  public getSettings(orgId: string) {
    return this.data.settings[orgId] || { scoringWeights: DEFAULT_SCORING_WEIGHTS, defaultStatus: 'New' };
  }

  public updateSettings(orgId: string, settings: any) {
    this.data.settings[orgId] = { ...this.getSettings(orgId), ...settings };
    this.saveData();
    return this.data.settings[orgId];
  }

  public reseed() {
    this.data = this.createSeedData();
    this.saveData();
    return true;
  }

  /**
   * Rich initial seed data for demo organization and realistic candidate pools
   */
  private createSeedData(): DatabaseSchema {
    const orgId = 'org-apex-talent-001';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('password123', salt);
    const adminHash = bcrypt.hashSync('admin123', salt);

    const organizations = [
      {
        id: orgId,
        name: 'Apex Talent Technologies',
        domain: 'apextalent.com',
        createdAt: '2026-01-15T08:00:00.000Z'
      }
    ];

    const users = [
      {
        id: 'usr-recruiter-01',
        organizationId: orgId,
        organizationName: 'Apex Talent Technologies',
        name: 'Sarah Jenkins',
        email: 'recruiter@apextalent.com',
        role: 'Recruiter' as const,
        passwordHash
      },
      {
        id: 'usr-admin-01',
        organizationId: orgId,
        organizationName: 'Apex Talent Technologies',
        name: 'Marcus Vance',
        email: 'admin@apextalent.com',
        role: 'Admin' as const,
        passwordHash: adminHash
      }
    ];

    const job1: Job = {
      id: 'job-swe-01',
      organizationId: orgId,
      title: 'Senior Software Engineer (Java & Cloud)',
      department: 'Engineering',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'Full Time',
      workMode: 'Hybrid',
      experienceLevel: '3–5 years',
      minYearsExperience: 3,
      salaryRange: '$140,000 - $175,000',
      openings: 3,
      status: 'Active',
      description: 'We are seeking an experienced Senior Software Engineer to build high-scale distributed backend systems and robust REST APIs. You will partner with product and infrastructure teams to design scalable microservices and modernize cloud architectures.',
      responsibilities: [
        'Architect, build, and optimize high-throughput distributed Java/Spring Boot microservices.',
        'Design resilient relational database schemas and optimize PostgreSQL queries and indexing.',
        'Implement robust RESTful APIs, OpenAPI contracts, and event-driven architectures.',
        'Deploy and manage containerized services using Docker and Kubernetes in AWS.',
        'Champion automated testing, CI/CD pipeline integration, and peer code reviews.'
      ],
      requiredSkills: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Git'],
      preferredSkills: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Kafka'],
      educationRequirements: ["Bachelor's or Master's degree in Computer Science, Software Engineering, or equivalent practical experience"],
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z'
    };

    const job2: Job = {
      id: 'job-ds-02',
      organizationId: orgId,
      title: 'Data Scientist & Machine Learning Engineer',
      department: 'Data & AI',
      location: 'New York, NY (Hybrid)',
      employmentType: 'Full Time',
      workMode: 'Hybrid',
      experienceLevel: '3–5 years',
      minYearsExperience: 3,
      salaryRange: '$150,000 - $185,000',
      openings: 2,
      status: 'Active',
      description: 'Join our Machine Learning team to develop state-of-the-art predictive models, NLP extraction pipelines, and recommendation algorithms that serve millions of daily inferences.',
      responsibilities: [
        'Train, evaluate, and fine-tune machine learning and deep learning models using PyTorch and Python.',
        'Construct production-grade ETL pipelines and feature engineering workflows with SQL and Pandas.',
        'Deploy scalable model inference microservices in Docker containers.',
        'Evaluate model fairness, explainability, and drift detection across production cohorts.'
      ],
      requiredSkills: ['Python', 'PyTorch', 'SQL', 'Machine Learning', 'Pandas'],
      preferredSkills: ['NLP', 'Docker', 'AWS', 'MLflow', 'FastAPI'],
      educationRequirements: ["Master's or Ph.D. in Computer Science, Data Science, Statistics, or related STEM field"],
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      createdAt: '2026-09-15T14:30:00.000Z',
      updatedAt: '2026-10-02T09:15:00.000Z'
    };

    const job3: Job = {
      id: 'job-devops-03',
      organizationId: orgId,
      title: 'DevOps & Cloud Infrastructure Architect',
      department: 'Infrastructure',
      location: 'Austin, TX (Remote)',
      employmentType: 'Full Time',
      workMode: 'Remote',
      experienceLevel: '5–8 years',
      minYearsExperience: 5,
      salaryRange: '$160,000 - $195,000',
      openings: 1,
      status: 'Active',
      description: 'Looking for a seasoned Cloud Infrastructure Architect to lead our multi-region Kubernetes clusters, Infrastructure as Code, and developer productivity tooling on AWS.',
      responsibilities: [
        'Provision and maintain multi-region cloud infrastructure using Terraform and Ansible.',
        'Manage high-availability Kubernetes (EKS) clusters, service mesh, and observability stacks.',
        'Optimize CI/CD pipelines in GitHub Actions for sub-5-minute release cycles.',
        'Enforce cloud security postures, IAM policies, and SOC2 compliance automation.'
      ],
      requiredSkills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
      preferredSkills: ['Docker', 'Python', 'Go', 'Prometheus', 'Bash/Shell'],
      educationRequirements: ["Bachelor's in Computer Science, Computer Engineering, or substantial cloud engineering track record"],
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      createdAt: '2026-09-18T11:00:00.000Z',
      updatedAt: '2026-10-03T16:20:00.000Z'
    };

    const job4: Job = {
      id: 'job-uiux-04',
      organizationId: orgId,
      title: 'Lead Product Designer (UI/UX)',
      department: 'Product Design',
      location: 'San Francisco, CA (Remote)',
      employmentType: 'Full Time',
      workMode: 'Remote',
      experienceLevel: '5–8 years',
      minYearsExperience: 5,
      salaryRange: '$145,000 - $175,000',
      openings: 1,
      status: 'Active',
      description: 'Lead design systems, user journeys, interactive prototypes, and UX research for our next-generation enterprise SaaS products.',
      responsibilities: [
        'Own end-to-end design lifecycle from discovery research to high-fidelity Figma components.',
        'Build and scale our multi-brand design system with strict accessibility tokens.',
        'Collaborate directly with frontend engineers on component fidelity and micro-interactions.'
      ],
      requiredSkills: ['Figma', 'UI/UX', 'Design Systems', 'User Research', 'Prototyping'],
      preferredSkills: ['HTML5', 'CSS3', 'Tailwind CSS', 'Design Thinking'],
      educationRequirements: ["Bachelor's degree in Design, HCI, or equivalent portfolio"],
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      createdAt: '2026-09-22T08:00:00.000Z',
      updatedAt: '2026-10-04T10:00:00.000Z'
    };

    const job5: Job = {
      id: 'job-pm-05',
      organizationId: orgId,
      title: 'Product Marketing Specialist',
      department: 'Marketing',
      location: 'Chicago, IL (Hybrid)',
      employmentType: 'Full Time',
      workMode: 'Hybrid',
      experienceLevel: '1–3 years',
      minYearsExperience: 2,
      salaryRange: '$85,000 - $105,000',
      openings: 1,
      status: 'Draft',
      description: 'Drive positioning, B2B SaaS launch campaigns, customer interviews, and competitive intelligence.',
      responsibilities: [
        'Author compelling product collateral, release notes, and case studies.',
        'Execute multi-channel digital acquisition and content marketing campaigns.'
      ],
      requiredSkills: ['Content Strategy', 'B2B SaaS', 'SEO', 'Analytics'],
      preferredSkills: ['HubSpot', 'Copywriting', 'Email Marketing'],
      educationRequirements: ["Bachelor's in Marketing, Communications, or Business"],
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
      createdAt: '2026-09-28T09:00:00.000Z',
      updatedAt: '2026-10-05T14:00:00.000Z'
    };

    const jobs = [job1, job2, job3, job4, job5];

    // Seed Candidates
    const candidates: Candidate[] = [
      {
        id: 'cand-01',
        organizationId: orgId,
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+1 (415) 890-1234',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/rahulsharma-dev',
        github: 'https://github.com/rahulsharma-code',
        summary: 'Staff-level backend engineer with 4.5 years hands-on experience designing distributed Java microservices, Spring Boot backends, PostgreSQL schemas, and AWS deployments.',
        skills: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Git', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'Microservices'],
        totalExperienceYears: 4.5,
        experienceTimeline: [
          {
            title: 'Senior Software Engineer',
            company: 'Nexlify Cloud Corp',
            startDate: '2023',
            endDate: 'Present',
            durationYears: 2.2,
            description: 'Architected high-throughput payment ingestion pipeline using Spring Boot and PostgreSQL, handling over 12,000 transactions per second. Reduced API latency by 38%.',
            technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'AWS'],
            isRelevant: true
          },
          {
            title: 'Backend Software Developer',
            company: 'AlphaMetrics Labs',
            startDate: '2021',
            endDate: '2023',
            durationYears: 2.3,
            description: 'Built RESTful services for real-time telemetry processing using Java, SQL, Git, and Docker. Collaborated on Kubernetes deployment manifests.',
            technologies: ['Java', 'REST API', 'SQL', 'Git', 'Kubernetes'],
            isRelevant: true
          }
        ],
        education: [
          {
            degree: 'Bachelor of Engineering in Computer Science',
            field: 'Computer Science',
            institution: 'National Institute of Technology',
            graduationYear: '2021',
            isRelevant: true
          }
        ],
        projects: [
          {
            title: 'Distributed Transaction Coordinator',
            description: 'Open-source 2-phase commit orchestrator using Java, Spring Boot, and PostgreSQL with automatic failover.',
            technologies: ['Java', 'Spring Boot', 'SQL', 'Docker']
          }
        ],
        certifications: ['AWS Certified Solutions Architect Associate', 'Oracle Certified Professional Java SE 17'],
        languages: ['English', 'Hindi'],
        originalResumeText: `Rahul Sharma\nEmail: rahul.sharma@example.com | Phone: +1 415 890 1234 | San Francisco, CA\nLinkedIn: https://linkedin.com/in/rahulsharma-dev\n\nPROFESSIONAL SUMMARY\nStaff-level backend engineer with 4.5 years hands-on experience designing distributed Java microservices, Spring Boot backends, PostgreSQL schemas, and AWS deployments.\n\nTECHNICAL SKILLS\nLanguages & Frameworks: Java, Spring Boot, REST API, SQL, PostgreSQL, Git\nCloud & Containers: Docker, Kubernetes, AWS (EC2, S3, RDS), Kafka\n\nWORK EXPERIENCE\nNexlify Cloud Corp | Senior Software Engineer | 2023 - Present\n- Architected high-throughput payment ingestion pipeline using Spring Boot and PostgreSQL handling 12,000 TPS.\n- Containerized microservices using Docker and orchestrated deployments on AWS EKS Kubernetes.\n\nAlphaMetrics Labs | Backend Software Developer | 2021 - 2023\n- Built RESTful services for real-time telemetry processing using Java, SQL, and Git.\n\nEDUCATION\nNational Institute of Technology | B.E. Computer Science | 2017 - 2021\n\nCERTIFICATIONS\nAWS Certified Solutions Architect Associate`,
        originalFileName: 'Rahul_Sharma_Resume.pdf',
        fileHash: 'hash-rahul-01',
        createdAt: '2026-09-12T11:00:00.000Z'
      },
      {
        id: 'cand-02',
        organizationId: orgId,
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+1 (510) 745-6621',
        location: 'San Jose, CA',
        linkedin: 'https://linkedin.com/in/priyapatel-swe',
        github: 'https://github.com/priyapatel',
        summary: 'Senior Java engineer with 3.8 years of backend engineering expertise. Strong in Spring Boot, REST APIs, Git, PostgreSQL, and Docker.',
        skills: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Git', 'Docker', 'PostgreSQL'],
        totalExperienceYears: 3.8,
        experienceTimeline: [
          {
            title: 'Software Engineer II',
            company: 'Zenith Health Systems',
            startDate: '2022',
            endDate: 'Present',
            durationYears: 2.8,
            description: 'Engineered HIPAA-compliant microservices using Spring Boot, Hibernate, and PostgreSQL. Wrote comprehensive OpenAPI specifications and unit tests.',
            technologies: ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'Docker'],
            isRelevant: true
          },
          {
            title: 'Associate Engineer',
            company: 'Innovatech Systems',
            startDate: '2021',
            endDate: '2022',
            durationYears: 1.0,
            description: 'Developed internal REST API endpoints and database migrations using Java and Git.',
            technologies: ['Java', 'REST API', 'Git'],
            isRelevant: true
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science in Computer Science',
            field: 'Computer Science',
            institution: 'University of California, Davis',
            graduationYear: '2021',
            isRelevant: true
          }
        ],
        projects: [
          {
            title: 'Healthcare EHR Sync Bridge',
            description: 'Spring Boot REST service integrating external healthcare feeds with encrypted PostgreSQL persistence.',
            technologies: ['Java', 'Spring Boot', 'SQL']
          }
        ],
        certifications: ['Oracle Certified Associate Java Programmer'],
        languages: ['English', 'Gujarati'],
        originalResumeText: `Priya Patel\nEmail: priya.patel@example.com | Phone: +1 510 745 6621 | San Jose, CA\n\nSUMMARY\nSoftware Engineer with 3.8 years experience in Java, Spring Boot, REST APIs, SQL, and Docker containerization.\n\nSKILLS\nJava, Spring Boot, REST API, SQL, PostgreSQL, Git, Docker\n\nEXPERIENCE\nZenith Health Systems | 2022 - Present | Software Engineer II\n- Developed healthcare microservices using Spring Boot, Docker, and PostgreSQL.\n\nInnovatech Systems | 2021 - 2022 | Associate Engineer\n- Developed Java REST APIs with Git version control.\n\nEDUCATION\nUC Davis - B.S. in Computer Science (2021)`,
        originalFileName: 'Priya_Patel_CV.pdf',
        fileHash: 'hash-priya-02',
        createdAt: '2026-09-13T14:10:00.000Z'
      },
      {
        id: 'cand-03',
        organizationId: orgId,
        name: 'Arjun Verma',
        email: 'arjun.verma@example.com',
        phone: '+1 (408) 555-8910',
        location: 'Fremont, CA',
        linkedin: 'https://linkedin.com/in/arjunverma',
        summary: 'Full stack developer with 3.2 years experience across Java, REST APIs, Git, React, and SQL.',
        skills: ['Java', 'REST API', 'SQL', 'Git', 'React', 'JavaScript'],
        totalExperienceYears: 3.2,
        experienceTimeline: [
          {
            title: 'Full Stack Developer',
            company: 'Veloce Digital',
            startDate: '2022',
            endDate: 'Present',
            durationYears: 2.2,
            description: 'Built enterprise web apps using Java backends, REST APIs, and React frontends. Managed Git branch workflows.',
            technologies: ['Java', 'REST API', 'Git', 'React', 'SQL'],
            isRelevant: true
          }
        ],
        education: [
          {
            degree: 'Bachelor of Technology in Information Technology',
            field: 'Information Technology',
            institution: 'Vellore Institute of Technology',
            graduationYear: '2022',
            isRelevant: true
          }
        ],
        projects: [
          {
            title: 'Inventory Portal',
            description: 'React UI with Java REST API and SQL database backend.',
            technologies: ['Java', 'SQL', 'React']
          }
        ],
        certifications: [],
        languages: ['English'],
        originalResumeText: `Arjun Verma\nEmail: arjun.verma@example.com | Fremont, CA\nFull Stack Developer with 3.2 years experience.\nSkills: Java, REST API, SQL, Git, React, JavaScript.\nExperience: Veloce Digital (2022-Present). Education: B.Tech IT 2022.`,
        originalFileName: 'Arjun_Verma_Resume.docx',
        fileHash: 'hash-arjun-03',
        createdAt: '2026-09-14T09:20:00.000Z'
      },
      {
        id: 'cand-04',
        organizationId: orgId,
        name: 'Sneha Kapoor',
        email: 'sneha.kapoor@example.com',
        phone: '+1 (650) 412-9801',
        location: 'Palo Alto, CA',
        summary: 'Software developer with 2.5 years experience in Java, SQL, and Git. Some Spring framework familiarity.',
        skills: ['Java', 'SQL', 'Git', 'HTML5'],
        totalExperienceYears: 2.5,
        experienceTimeline: [
          {
            title: 'Junior Software Engineer',
            company: 'CloudMatrix Inc',
            startDate: '2023',
            endDate: 'Present',
            durationYears: 1.8,
            description: 'Maintained internal Java batch processing applications and SQL reporting queries.',
            technologies: ['Java', 'SQL', 'Git'],
            isRelevant: true
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science in Computer Science',
            field: 'Computer Science',
            institution: 'San Jose State University',
            graduationYear: '2023',
            isRelevant: true
          }
        ],
        projects: [],
        certifications: [],
        languages: ['English'],
        originalResumeText: `Sneha Kapoor | sneha.kapoor@example.com | Palo Alto, CA\nSoftware Developer with 2.5 years experience.\nSkills: Java, SQL, Git.\nExperience: CloudMatrix Inc (2023-Present) - Junior Software Engineer.\nEducation: B.S. Computer Science, SJSU (2023).`,
        originalFileName: 'Sneha_Kapoor_CV.pdf',
        fileHash: 'hash-sneha-04',
        createdAt: '2026-09-15T16:00:00.000Z'
      },
      {
        id: 'cand-05',
        organizationId: orgId,
        name: 'Kiran Rao',
        email: 'kiran.rao@example.com',
        phone: '+1 (415) 301-4478',
        location: 'Oakland, CA',
        summary: 'Junior developer with 1.4 years experience in Python and basic SQL. Looking to transition into Java backend engineering.',
        skills: ['Python', 'SQL', 'Git', 'HTML5', 'CSS3'],
        totalExperienceYears: 1.4,
        experienceTimeline: [
          {
            title: 'Junior Developer',
            company: 'ByteWave Labs',
            startDate: '2024',
            endDate: 'Present',
            durationYears: 1.4,
            description: 'Developed Python data extraction scripts and maintained Git repositories.',
            technologies: ['Python', 'SQL', 'Git'],
            isRelevant: false
          }
        ],
        education: [
          {
            degree: 'Bachelor of Arts in Economics',
            field: 'Economics',
            institution: 'UC Berkeley',
            graduationYear: '2023',
            isRelevant: false
          }
        ],
        projects: [],
        certifications: [],
        languages: ['English'],
        originalResumeText: `Kiran Rao | kiran.rao@example.com | Oakland, CA\nJunior developer with Python and SQL experience.\nSkills: Python, SQL, Git, HTML, CSS.\nExperience: ByteWave Labs (2024-Present). Education: B.A. Economics, UC Berkeley.`,
        originalFileName: 'Kiran_Rao_Resume.pdf',
        fileHash: 'hash-kiran-05',
        createdAt: '2026-09-16T12:45:00.000Z'
      },
      {
        id: 'cand-06',
        organizationId: orgId,
        name: 'Devendra Sen',
        email: 'devendra.sen@example.com',
        phone: '+1 (408) 881-2290',
        location: 'Sunnyvale, CA',
        summary: 'WordPress and PHP web designer with 2 years experience in HTML, CSS, PHP, and MySQL.',
        skills: ['PHP', 'MySQL', 'HTML5', 'CSS3', 'WordPress'],
        totalExperienceYears: 2.0,
        experienceTimeline: [
          {
            title: 'Web Specialist',
            company: 'StudioPixel Design',
            startDate: '2023',
            endDate: 'Present',
            durationYears: 2.0,
            description: 'Built WordPress sites with PHP and MySQL.',
            technologies: ['PHP', 'MySQL', 'HTML5'],
            isRelevant: false
          }
        ],
        education: [
          {
            degree: 'Associate Degree in Web Development',
            field: 'Web Design',
            institution: 'De Anza College',
            graduationYear: '2022',
            isRelevant: false
          }
        ],
        projects: [],
        certifications: [],
        languages: ['English'],
        originalResumeText: `Devendra Sen | devendra.sen@example.com | Sunnyvale, CA\nWeb Designer with PHP, MySQL, WordPress, HTML5.\nEducation: Associate Degree in Web Development.`,
        originalFileName: 'Devendra_Sen_CV.txt',
        fileHash: 'hash-devendra-06',
        createdAt: '2026-09-17T10:15:00.000Z'
      },
      // Data Science Candidates
      {
        id: 'cand-07',
        organizationId: orgId,
        name: 'Dr. Elena Rostova',
        email: 'elena.rostova@example.com',
        phone: '+1 (212) 690-4412',
        location: 'New York, NY',
        linkedin: 'https://linkedin.com/in/elena-rostova-phd',
        summary: 'Lead Data Scientist with Ph.D. in Computational Statistics and 4.8 years experience building deep learning models with PyTorch, Python, SQL, NLP, and Docker in AWS.',
        skills: ['Python', 'PyTorch', 'SQL', 'Machine Learning', 'Pandas', 'NLP', 'Docker', 'AWS', 'MLflow', 'FastAPI'],
        totalExperienceYears: 4.8,
        experienceTimeline: [
          {
            title: 'Senior Machine Learning Scientist',
            company: 'QuantCognition AI',
            startDate: '2022',
            endDate: 'Present',
            durationYears: 2.8,
            description: 'Led research and deployment of transformer NLP models using PyTorch and FastAPI, serving 4M requests/day on AWS with Docker.',
            technologies: ['Python', 'PyTorch', 'NLP', 'Docker', 'AWS'],
            isRelevant: true
          },
          {
            title: 'Data Scientist',
            company: 'OmniData Analytics',
            startDate: '2020',
            endDate: '2022',
            durationYears: 2.0,
            description: 'Built statistical predictive models in Python, SQL, and Pandas with automated MLflow tracking.',
            technologies: ['Python', 'SQL', 'Pandas', 'Machine Learning'],
            isRelevant: true
          }
        ],
        education: [
          {
            degree: 'Ph.D. in Computational Statistics',
            field: 'Data Science & Statistics',
            institution: 'Columbia University',
            graduationYear: '2020',
            isRelevant: true
          }
        ],
        projects: [
          {
            title: 'Multimodal Transformer Retrieval Engine',
            description: 'Custom fine-tuned PyTorch embedding model for semantic document search with Dockerized FastAPI deployment.',
            technologies: ['PyTorch', 'Python', 'Docker']
          }
        ],
        certifications: ['AWS Certified Machine Learning Specialty'],
        languages: ['English', 'Russian'],
        originalResumeText: `Dr. Elena Rostova\nPh.D. Computational Statistics, Columbia University (2020)\nSenior ML Scientist with PyTorch, Python, SQL, Pandas, NLP, Docker, AWS, MLflow.\nExperience: QuantCognition AI (2022-Present), OmniData (2020-2022).`,
        originalFileName: 'Elena_Rostova_PhD_Resume.pdf',
        fileHash: 'hash-elena-07',
        createdAt: '2026-09-19T11:00:00.000Z'
      },
      {
        id: 'cand-08',
        organizationId: orgId,
        name: 'Marcus Chen',
        email: 'marcus.chen@example.com',
        phone: '+1 (917) 802-5511',
        location: 'Brooklyn, NY',
        summary: 'Data Scientist with 3.5 years experience in Python, Pandas, SQL, and Machine Learning models.',
        skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Scikit-Learn', 'Docker'],
        totalExperienceYears: 3.5,
        experienceTimeline: [
          {
            title: 'Data Scientist',
            company: 'FinSight Technologies',
            startDate: '2022',
            endDate: 'Present',
            durationYears: 2.5,
            description: 'Engineered churn prediction and credit risk models using Python, Pandas, and Scikit-Learn.',
            technologies: ['Python', 'Pandas', 'SQL', 'Machine Learning'],
            isRelevant: true
          }
        ],
        education: [
          {
            degree: 'Master of Science in Data Science',
            field: 'Data Science',
            institution: 'NYU Stern / Courant',
            graduationYear: '2021',
            isRelevant: true
          }
        ],
        projects: [],
        certifications: [],
        languages: ['English', 'Mandarin'],
        originalResumeText: `Marcus Chen | marcus.chen@example.com | Brooklyn, NY\nData Scientist with 3.5 years experience.\nSkills: Python, SQL, Pandas, Machine Learning, Scikit-Learn, Docker.\nEducation: M.S. Data Science, NYU.`,
        originalFileName: 'Marcus_Chen_Resume.pdf',
        fileHash: 'hash-marcus-08',
        createdAt: '2026-09-20T15:00:00.000Z'
      },
      // DevOps candidates
      {
        id: 'cand-09',
        organizationId: orgId,
        name: 'Sarah Connor-Brooks',
        email: 'sarah.brooks@example.com',
        phone: '+1 (512) 991-3841',
        location: 'Austin, TX',
        summary: 'Cloud Architect & DevOps Lead with 6.2 years experience across AWS, Kubernetes, Terraform, Linux, and CI/CD automation.',
        skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Docker', 'Python', 'Bash/Shell'],
        totalExperienceYears: 6.2,
        experienceTimeline: [
          {
            title: 'Lead DevOps Engineer',
            company: 'ScaleGrid Systems',
            startDate: '2021',
            endDate: 'Present',
            durationYears: 4.0,
            description: 'Designed multi-region AWS cloud infrastructure using Terraform. Managed 45-node production EKS Kubernetes clusters.',
            technologies: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
            isRelevant: true
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science in Computer Engineering',
            field: 'Computer Engineering',
            institution: 'UT Austin',
            graduationYear: '2019',
            isRelevant: true
          }
        ],
        projects: [],
        certifications: ['AWS Certified Solutions Architect Professional', 'Certified Kubernetes Administrator (CKA)'],
        languages: ['English'],
        originalResumeText: `Sarah Connor-Brooks | Austin, TX\nLead DevOps with AWS, Kubernetes, Terraform, CI/CD, Linux, Docker, Python.\nCKA & AWS Solutions Architect Professional certified.`,
        originalFileName: 'Sarah_Brooks_DevOps_CV.pdf',
        fileHash: 'hash-sarah-09',
        createdAt: '2026-09-21T09:00:00.000Z'
      }
    ];

    // Seed Applications & Detailed Resume Analyses
    const applications: Application[] = [
      // Job 1 Candidates
      {
        id: 'app-01',
        candidateId: 'cand-01',
        jobId: 'job-swe-01',
        candidate: candidates[0],
        atsScore: 94,
        status: 'Shortlisted',
        statusHistory: [
          { id: 'sh-1', status: 'New', changedBy: 'System', changedAt: '2026-09-12T11:00:00.000Z' },
          { id: 'sh-2', status: 'Screening', changedBy: 'Sarah Jenkins', changedAt: '2026-09-13T09:30:00.000Z' },
          { id: 'sh-3', status: 'Shortlisted', changedBy: 'Sarah Jenkins', changedAt: '2026-09-14T15:20:00.000Z', note: 'Exceptional Java + AWS experience. High priority candidate.' }
        ],
        appliedDate: '2026-09-12T11:00:00.000Z',
        analysis: {
          id: 'analysis-01',
          applicationId: 'app-01',
          overallScore: 94,
          breakdown: {
            requiredSkills: {
              score: 30,
              max: 30,
              matched: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Git'],
              missing: [],
              partial: []
            },
            experience: {
              score: 20,
              max: 20,
              candidateYears: 4.5,
              requiredYears: 3,
              matchLevel: 'Strong'
            },
            responsibilities: {
              score: 14,
              max: 15,
              alignment: 'High'
            },
            preferredSkills: {
              score: 9,
              max: 10,
              matched: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL'],
              missing: ['Kafka']
            },
            projects: {
              score: 10,
              max: 10,
              relevantCount: 2
            },
            education: {
              score: 5,
              max: 5,
              matchLevel: 'Strong',
              degree: 'B.E. in Computer Science (NIT)'
            },
            certifications: {
              score: 5,
              max: 5,
              items: ['AWS Solutions Architect', 'Oracle Java SE 17']
            },
            relevance: {
              score: 5,
              max: 5,
              semanticScore: 96
            }
          },
          aiSummary: 'Rahul is an outstanding match for the Senior Software Engineer position with 4.5 years of relevant backend experience. His resume demonstrates deep mastery in Java, Spring Boot, high-throughput PostgreSQL architectures, and production AWS Kubernetes deployments.',
          recommendation: 'Strong Match',
          strengths: [
            '100% coverage of required skills (Java, Spring Boot, REST API, SQL, Git)',
            '4.5 years relevant distributed systems experience (exceeds 3-year requirement)',
            'Production containerization and AWS cloud architecture with official certifications',
            'Demonstrated scale: architected payment service handling 12,000 TPS'
          ],
          gaps: [
            'Apache Kafka experience is not explicitly identified in the provided resume'
          ],
          whyThisScore: {
            positives: [
              '+ Matched all 5/5 required core skills with strong production context',
              '+ 4.5 years relevant experience exceeds the 3+ years requirement',
              '+ Verified cloud experience: Docker, Kubernetes, AWS Certified Solutions Architect',
              '+ Computer Science engineering degree meets all academic criteria'
            ],
            negatives: [
              '- Kafka message bus experience was not identified in the provided resume'
            ]
          },
          skillEvidences: [
            { skill: 'Java', status: 'matched', source: 'Lead developer on Java backend services at Nexlify and AlphaMetrics', confidence: 0.99 },
            { skill: 'Spring Boot', status: 'matched', source: 'Spring Boot payment ingestion pipeline handling 12,000 TPS', confidence: 0.98 },
            { skill: 'REST API', status: 'matched', source: 'Built RESTful services for real-time telemetry processing', confidence: 0.97 },
            { skill: 'SQL', status: 'matched', source: 'PostgreSQL schema optimization and query tuning', confidence: 0.95 },
            { skill: 'Git', status: 'matched', source: 'Managed team branching and PR workflows', confidence: 0.95 },
            { skill: 'AWS', status: 'matched', source: 'AWS EKS Kubernetes and AWS Solutions Architect Associate certified', confidence: 0.96 },
            { skill: 'Kafka', status: 'missing', source: 'Not identified in the provided resume.', confidence: 0.9 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-12T11:05:00.000Z'
        }
      },
      {
        id: 'app-02',
        candidateId: 'cand-02',
        jobId: 'job-swe-01',
        candidate: candidates[1],
        atsScore: 88,
        status: 'Interview',
        interviewDate: '2026-10-14T10:00:00.000Z',
        statusHistory: [
          { id: 'sh-4', status: 'New', changedBy: 'System', changedAt: '2026-09-13T14:10:00.000Z' },
          { id: 'sh-5', status: 'Shortlisted', changedBy: 'Sarah Jenkins', changedAt: '2026-09-15T11:00:00.000Z' },
          { id: 'sh-6', status: 'Interview', changedBy: 'Sarah Jenkins', changedAt: '2026-09-18T14:00:00.000Z', note: 'Technical interview scheduled with Lead Architect.' }
        ],
        appliedDate: '2026-09-13T14:10:00.000Z',
        analysis: {
          id: 'analysis-02',
          applicationId: 'app-02',
          overallScore: 88,
          breakdown: {
            requiredSkills: {
              score: 30,
              max: 30,
              matched: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Git'],
              missing: [],
              partial: []
            },
            experience: {
              score: 19,
              max: 20,
              candidateYears: 3.8,
              requiredYears: 3,
              matchLevel: 'Strong'
            },
            responsibilities: {
              score: 13,
              max: 15,
              alignment: 'High'
            },
            preferredSkills: {
              score: 7,
              max: 10,
              matched: ['Docker', 'PostgreSQL'],
              missing: ['AWS', 'Kubernetes', 'Kafka']
            },
            projects: {
              score: 8,
              max: 10,
              relevantCount: 1
            },
            education: {
              score: 5,
              max: 5,
              matchLevel: 'Strong',
              degree: 'B.S. Computer Science (UC Davis)'
            },
            certifications: {
              score: 4,
              max: 5,
              items: ['Oracle Certified Associate']
            },
            relevance: {
              score: 4,
              max: 5,
              semanticScore: 89
            }
          },
          aiSummary: 'Priya is a solid candidate for the Senior Software Engineer position with 3.8 years of proven experience in Java, Spring Boot, REST APIs, and PostgreSQL. Demonstrates strong software engineering rigor.',
          recommendation: 'Strong Match',
          strengths: [
            'All core required skills matched (Java, Spring Boot, REST API, SQL, Git)',
            '3.8 years relevant enterprise backend development experience',
            'Strong foundation in relational databases and Docker'
          ],
          gaps: [
            'AWS and Kubernetes production experience not identified in resume'
          ],
          whyThisScore: {
            positives: [
              '+ Meets 100% of required skills',
              '+ 3.8 years experience exceeds the 3-year threshold',
              '+ Strong CS degree from UC Davis'
            ],
            negatives: [
              '- AWS cloud experience not identified in the provided resume',
              '- Kubernetes container orchestration not identified in the provided resume'
            ]
          },
          skillEvidences: [
            { skill: 'Java', status: 'matched', source: 'Software Engineer II at Zenith Health Systems', confidence: 0.98 },
            { skill: 'Spring Boot', status: 'matched', source: 'Engineered microservices using Spring Boot & Hibernate', confidence: 0.98 },
            { skill: 'AWS', status: 'missing', source: 'Not identified in the provided resume.', confidence: 0.92 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-13T14:15:00.000Z'
        }
      },
      {
        id: 'app-03',
        candidateId: 'cand-03',
        jobId: 'job-swe-01',
        candidate: candidates[2],
        atsScore: 78,
        status: 'Screening',
        statusHistory: [
          { id: 'sh-7', status: 'New', changedBy: 'System', changedAt: '2026-09-14T09:20:00.000Z' },
          { id: 'sh-8', status: 'Screening', changedBy: 'Sarah Jenkins', changedAt: '2026-09-16T10:00:00.000Z' }
        ],
        appliedDate: '2026-09-14T09:20:00.000Z',
        analysis: {
          id: 'analysis-03',
          applicationId: 'app-03',
          overallScore: 78,
          breakdown: {
            requiredSkills: {
              score: 24,
              max: 30,
              matched: ['Java', 'REST API', 'SQL', 'Git'],
              missing: ['Spring Boot'],
              partial: []
            },
            experience: {
              score: 18,
              max: 20,
              candidateYears: 3.2,
              requiredYears: 3,
              matchLevel: 'Moderate'
            },
            responsibilities: {
              score: 12,
              max: 15,
              alignment: 'Medium'
            },
            preferredSkills: {
              score: 4,
              max: 10,
              matched: [],
              missing: ['AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Kafka']
            },
            projects: {
              score: 8,
              max: 10,
              relevantCount: 1
            },
            education: {
              score: 5,
              max: 5,
              matchLevel: 'Strong',
              degree: 'B.Tech in Information Technology'
            },
            certifications: {
              score: 2,
              max: 5,
              items: []
            },
            relevance: {
              score: 4,
              max: 5,
              semanticScore: 78
            }
          },
          aiSummary: 'Arjun meets the baseline experience requirements with 3.2 years of full-stack engineering. He possesses Java, REST, and SQL skills, but Spring Boot and cloud containerization tools are not identified.',
          recommendation: 'Good Match',
          strengths: ['Solid Java and REST API background', 'Meets experience minimum (3.2 years)'],
          gaps: ['Spring Boot framework not identified in resume', 'No cloud/DevOps tools listed'],
          whyThisScore: {
            positives: ['+ 4 of 5 required skills identified', '+ Meets 3-year experience threshold'],
            negatives: ['- Spring Boot not identified in resume', '- AWS/Docker/Kubernetes not identified']
          },
          skillEvidences: [
            { skill: 'Java', status: 'matched', source: 'Built enterprise web apps using Java backends', confidence: 0.95 },
            { skill: 'Spring Boot', status: 'missing', source: 'Not identified in the provided resume.', confidence: 0.9 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-14T09:25:00.000Z'
        }
      },
      {
        id: 'app-04',
        candidateId: 'cand-04',
        jobId: 'job-swe-01',
        candidate: candidates[3],
        atsScore: 64,
        status: 'On Hold',
        statusHistory: [
          { id: 'sh-9', status: 'New', changedBy: 'System', changedAt: '2026-09-15T16:00:00.000Z' },
          { id: 'sh-10', status: 'On Hold', changedBy: 'Sarah Jenkins', changedAt: '2026-09-17T11:00:00.000Z', note: 'Below minimum 3 years experience. Keep on hold for junior openings.' }
        ],
        appliedDate: '2026-09-15T16:00:00.000Z',
        analysis: {
          id: 'analysis-04',
          applicationId: 'app-04',
          overallScore: 64,
          breakdown: {
            requiredSkills: {
              score: 18,
              max: 30,
              matched: ['Java', 'SQL', 'Git'],
              missing: ['Spring Boot', 'REST API'],
              partial: []
            },
            experience: {
              score: 13,
              max: 20,
              candidateYears: 2.5,
              requiredYears: 3,
              matchLevel: 'Weak'
            },
            responsibilities: {
              score: 10,
              max: 15,
              alignment: 'Medium'
            },
            preferredSkills: {
              score: 2,
              max: 10,
              matched: [],
              missing: ['AWS', 'Docker', 'Kubernetes']
            },
            projects: {
              score: 5,
              max: 10,
              relevantCount: 0
            },
            education: {
              score: 5,
              max: 5,
              matchLevel: 'Strong',
              degree: 'B.S. Computer Science'
            },
            certifications: {
              score: 2,
              max: 5,
              items: []
            },
            relevance: {
              score: 3,
              max: 5,
              semanticScore: 62
            }
          },
          aiSummary: 'Sneha has 2.5 years experience which is below the 3-year minimum for this Senior role. Demonstrates basic Java, SQL, and Git competence, but lacks Spring Boot and modern cloud stack.',
          recommendation: 'Moderate Match',
          strengths: ['Valid Computer Science degree', 'Fundamental Java and SQL knowledge'],
          gaps: ['Below 3 years experience threshold', 'Spring Boot and REST API missing from resume'],
          whyThisScore: {
            positives: ['+ Computer Science graduate', '+ 3 core skills matched (Java, SQL, Git)'],
            negatives: ['- 2.5 years experience is below 3-year requirement', '- Spring Boot and REST APIs missing']
          },
          skillEvidences: [
            { skill: 'Java', status: 'matched', source: 'Junior Software Engineer at CloudMatrix', confidence: 0.95 },
            { skill: 'Spring Boot', status: 'missing', source: 'Not identified in the provided resume.', confidence: 0.9 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-15T16:05:00.000Z'
        }
      },
      {
        id: 'app-05',
        candidateId: 'cand-05',
        jobId: 'job-swe-01',
        candidate: candidates[4],
        atsScore: 48,
        status: 'Rejected',
        statusHistory: [
          { id: 'sh-11', status: 'New', changedBy: 'System', changedAt: '2026-09-16T12:45:00.000Z' },
          { id: 'sh-12', status: 'Rejected', changedBy: 'Sarah Jenkins', changedAt: '2026-09-17T14:30:00.000Z', note: 'Does not meet core Java or experience requirements.' }
        ],
        appliedDate: '2026-09-16T12:45:00.000Z',
        analysis: {
          id: 'analysis-05',
          applicationId: 'app-05',
          overallScore: 48,
          breakdown: {
            requiredSkills: {
              score: 12,
              max: 30,
              matched: ['SQL', 'Git'],
              missing: ['Java', 'Spring Boot', 'REST API'],
              partial: []
            },
            experience: {
              score: 8,
              max: 20,
              candidateYears: 1.4,
              requiredYears: 3,
              matchLevel: 'Weak'
            },
            responsibilities: {
              score: 7,
              max: 15,
              alignment: 'Low'
            },
            preferredSkills: {
              score: 2,
              max: 10,
              matched: [],
              missing: ['AWS', 'Docker', 'Kubernetes']
            },
            projects: {
              score: 4,
              max: 10,
              relevantCount: 0
            },
            education: {
              score: 3,
              max: 5,
              matchLevel: 'Weak',
              degree: 'B.A. Economics'
            },
            certifications: {
              score: 2,
              max: 5,
              items: []
            },
            relevance: {
              score: 2,
              max: 5,
              semanticScore: 40
            }
          },
          aiSummary: 'Kiran lacks the required Java backend programming background and has only 1.4 years of general Python scripting experience, well below the senior role criteria.',
          recommendation: 'Weak Match',
          strengths: ['Familiar with Git and basic SQL'],
          gaps: ['No Java or Spring Boot experience identified', '1.4 years vs 3+ years required'],
          whyThisScore: {
            positives: ['+ Basic SQL and Git knowledge'],
            negatives: ['- Core Java not identified in resume', '- 1.4 years total experience']
          },
          skillEvidences: [
            { skill: 'Java', status: 'missing', source: 'Not identified in the provided resume.', confidence: 0.95 },
            { skill: 'Spring Boot', status: 'missing', source: 'Not identified in the provided resume.', confidence: 0.95 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-16T12:50:00.000Z'
        }
      },
      // Job 2 Candidates
      {
        id: 'app-06',
        candidateId: 'cand-07',
        jobId: 'job-ds-02',
        candidate: candidates[6],
        atsScore: 96,
        status: 'Shortlisted',
        statusHistory: [
          { id: 'sh-13', status: 'New', changedBy: 'System', changedAt: '2026-09-19T11:00:00.000Z' },
          { id: 'sh-14', status: 'Shortlisted', changedBy: 'Sarah Jenkins', changedAt: '2026-09-20T10:00:00.000Z' }
        ],
        appliedDate: '2026-09-19T11:00:00.000Z',
        analysis: {
          id: 'analysis-06',
          applicationId: 'app-06',
          overallScore: 96,
          breakdown: {
            requiredSkills: {
              score: 30,
              max: 30,
              matched: ['Python', 'PyTorch', 'SQL', 'Machine Learning', 'Pandas'],
              missing: [],
              partial: []
            },
            experience: {
              score: 20,
              max: 20,
              candidateYears: 4.8,
              requiredYears: 3,
              matchLevel: 'Strong'
            },
            responsibilities: {
              score: 15,
              max: 15,
              alignment: 'High'
            },
            preferredSkills: {
              score: 10,
              max: 10,
              matched: ['NLP', 'Docker', 'AWS', 'MLflow', 'FastAPI'],
              missing: []
            },
            projects: {
              score: 10,
              max: 10,
              relevantCount: 2
            },
            education: {
              score: 5,
              max: 5,
              matchLevel: 'Strong',
              degree: 'Ph.D. in Computational Statistics (Columbia)'
            },
            certifications: {
              score: 5,
              max: 5,
              items: ['AWS Certified ML Specialty']
            },
            relevance: {
              score: 5,
              max: 5,
              semanticScore: 98
            }
          },
          aiSummary: 'Dr. Elena Rostova is an extraordinary candidate matching 100% of required and preferred requirements. Her Ph.D. from Columbia and extensive PyTorch production experience make her an immediate high-impact hire.',
          recommendation: 'Strong Match',
          strengths: ['100% skill match across required and preferred', 'Columbia Ph.D. in Computational Statistics', 'Demonstrated production NLP transformer deployment'],
          gaps: [],
          whyThisScore: {
            positives: ['+ All 5 required skills and all 5 preferred skills matched', '+ Ph.D. degree perfectly satisfies educational requirement', '+ AWS Certified ML Specialty'],
            negatives: []
          },
          skillEvidences: [
            { skill: 'Python', status: 'matched', source: 'Core language across all research and industry roles', confidence: 0.99 },
            { skill: 'PyTorch', status: 'matched', source: 'Led transformer NLP models using PyTorch', confidence: 0.99 },
            { skill: 'Machine Learning', status: 'matched', source: 'Senior ML Scientist at QuantCognition', confidence: 0.99 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-19T11:05:00.000Z'
        }
      },
      {
        id: 'app-07',
        candidateId: 'cand-08',
        jobId: 'job-ds-02',
        candidate: candidates[7],
        atsScore: 82,
        status: 'Screening',
        statusHistory: [
          { id: 'sh-15', status: 'New', changedBy: 'System', changedAt: '2026-09-20T15:00:00.000Z' },
          { id: 'sh-16', status: 'Screening', changedBy: 'Sarah Jenkins', changedAt: '2026-09-21T11:00:00.000Z' }
        ],
        appliedDate: '2026-09-20T15:00:00.000Z',
        analysis: {
          id: 'analysis-07',
          applicationId: 'app-07',
          overallScore: 82,
          breakdown: {
            requiredSkills: {
              score: 24,
              max: 30,
              matched: ['Python', 'SQL', 'Machine Learning', 'Pandas'],
              missing: ['PyTorch'],
              partial: []
            },
            experience: {
              score: 19,
              max: 20,
              candidateYears: 3.5,
              requiredYears: 3,
              matchLevel: 'Strong'
            },
            responsibilities: {
              score: 13,
              max: 15,
              alignment: 'High'
            },
            preferredSkills: {
              score: 5,
              max: 10,
              matched: ['Docker'],
              missing: ['NLP', 'AWS', 'MLflow']
            },
            projects: {
              score: 7,
              max: 10,
              relevantCount: 1
            },
            education: {
              score: 5,
              max: 5,
              matchLevel: 'Strong',
              degree: 'M.S. in Data Science (NYU)'
            },
            certifications: {
              score: 2,
              max: 5,
              items: []
            },
            relevance: {
              score: 4,
              max: 5,
              semanticScore: 83
            }
          },
          aiSummary: 'Marcus has 3.5 years of strong tabular modeling and SQL analytics experience with an NYU Master degree. PyTorch and deep learning frameworks are not identified in his profile.',
          recommendation: 'Good Match',
          strengths: ['Strong Python, SQL, and Pandas data wrangling', 'NYU Data Science Master degree'],
          gaps: ['PyTorch framework not identified in resume'],
          whyThisScore: {
            positives: ['+ 4 of 5 required skills verified', '+ Exceeds 3 years experience'],
            negatives: ['- PyTorch not identified in resume']
          },
          skillEvidences: [
            { skill: 'Python', status: 'matched', source: 'FinSight Technologies data modeling', confidence: 0.97 },
            { skill: 'PyTorch', status: 'missing', source: 'Not identified in the provided resume.', confidence: 0.9 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-20T15:05:00.000Z'
        }
      },
      // Job 3 Candidates
      {
        id: 'app-08',
        candidateId: 'cand-09',
        jobId: 'job-devops-03',
        candidate: candidates[8],
        atsScore: 95,
        status: 'Shortlisted',
        statusHistory: [
          { id: 'sh-17', status: 'New', changedBy: 'System', changedAt: '2026-09-21T09:00:00.000Z' },
          { id: 'sh-18', status: 'Shortlisted', changedBy: 'Sarah Jenkins', changedAt: '2026-09-22T08:30:00.000Z' }
        ],
        appliedDate: '2026-09-21T09:00:00.000Z',
        analysis: {
          id: 'analysis-08',
          applicationId: 'app-08',
          overallScore: 95,
          breakdown: {
            requiredSkills: {
              score: 30,
              max: 30,
              matched: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
              missing: [],
              partial: []
            },
            experience: {
              score: 20,
              max: 20,
              candidateYears: 6.2,
              requiredYears: 5,
              matchLevel: 'Strong'
            },
            responsibilities: {
              score: 15,
              max: 15,
              alignment: 'High'
            },
            preferredSkills: {
              score: 9,
              max: 10,
              matched: ['Docker', 'Python', 'Bash/Shell'],
              missing: ['Prometheus']
            },
            projects: {
              score: 8,
              max: 10,
              relevantCount: 1
            },
            education: {
              score: 5,
              max: 5,
              matchLevel: 'Strong',
              degree: 'B.S. in Computer Engineering (UT Austin)'
            },
            certifications: {
              score: 5,
              max: 5,
              items: ['AWS Solutions Architect Pro', 'CKA']
            },
            relevance: {
              score: 5,
              max: 5,
              semanticScore: 97
            }
          },
          aiSummary: 'Sarah is an exemplary candidate for the Infrastructure Architect opening. With 6.2 years experience, CKA and AWS Pro certifications, and comprehensive Terraform multi-region expertise.',
          recommendation: 'Strong Match',
          strengths: ['100% required skills matched', '6.2 years hands-on infrastructure experience', 'Double certified: CKA and AWS Solutions Architect Pro'],
          gaps: [],
          whyThisScore: {
            positives: ['+ All 5 required skills verified in production', '+ 6.2 years exceeds 5-year requirement', '+ Top-tier industry certifications (CKA, AWS Pro)'],
            negatives: []
          },
          skillEvidences: [
            { skill: 'AWS', status: 'matched', source: 'Designed multi-region AWS cloud infrastructure', confidence: 0.99 },
            { skill: 'Kubernetes', status: 'matched', source: 'Managed 45-node production EKS Kubernetes clusters', confidence: 0.99 },
            { skill: 'Terraform', status: 'matched', source: 'Infrastructure as code lead using Terraform', confidence: 0.99 }
          ],
          isAiGenerated: true,
          analyzedAt: '2026-09-21T09:05:00.000Z'
        }
      }
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'log-01',
        organizationId: orgId,
        userId: 'usr-recruiter-01',
        userName: 'Sarah Jenkins',
        action: 'Job Created',
        entity: 'Job',
        entityId: 'job-swe-01',
        timestamp: '2026-09-10T10:00:00.000Z',
        details: 'Created job opening "Senior Software Engineer (Java & Cloud)"'
      },
      {
        id: 'log-02',
        organizationId: orgId,
        userId: 'usr-recruiter-01',
        userName: 'Sarah Jenkins',
        action: 'Resume Uploaded & Analyzed',
        entity: 'Candidate',
        entityId: 'cand-01',
        timestamp: '2026-09-12T11:05:00.000Z',
        details: 'Parsed resume Rahul_Sharma_Resume.pdf. ATS Score calculated: 94/100.'
      },
      {
        id: 'log-03',
        organizationId: orgId,
        userId: 'usr-recruiter-01',
        userName: 'Sarah Jenkins',
        action: 'Status Updated',
        entity: 'Application',
        entityId: 'app-01',
        timestamp: '2026-09-14T15:20:00.000Z',
        details: 'Shortlisted Rahul Sharma for Senior Software Engineer.'
      },
      {
        id: 'log-04',
        organizationId: orgId,
        userId: 'usr-recruiter-01',
        userName: 'Sarah Jenkins',
        action: 'Status Updated',
        entity: 'Application',
        entityId: 'app-02',
        timestamp: '2026-09-18T14:00:00.000Z',
        details: 'Moved Priya Patel to Interview stage.'
      }
    ];

    const settings = {
      [orgId]: {
        scoringWeights: DEFAULT_SCORING_WEIGHTS,
        defaultStatus: 'New'
      }
    };

    return {
      organizations,
      users,
      jobs,
      candidates,
      applications,
      auditLogs,
      settings
    };
  }
}

export const db = new Database();
