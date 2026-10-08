import { generateJSONCompletion } from './ai/aiProvider';
import { normalizeSkill, normalizeSkillsList } from './skillNormalizer';
import { Job, ExperienceLevel } from '../../src/types/ats';

export interface ExtractedJobRequirements {
  title?: string;
  department?: string;
  location?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  educationRequirements: string[];
  minYearsExperience: number;
  experienceLevel: ExperienceLevel;
  keywords: string[];
}

export async function analyzeJobDescription(rawText: string): Promise<ExtractedJobRequirements> {
  const prompt = `Analyze this Job Description and extract structured requirements for an ATS screening system:
Job Description:
"""
${rawText.slice(0, 4000)}
"""

Return JSON format:
{
  "title": "Extracted Job Title if identifiable",
  "department": "Engineering / Marketing / etc",
  "location": "e.g. San Francisco or Remote",
  "requiredSkills": ["list of strictly required or must-have skills/technologies"],
  "preferredSkills": ["list of nice-to-have, bonus, or preferred skills"],
  "responsibilities": ["3-6 core responsibilities as concise bullet points"],
  "educationRequirements": ["degree level e.g. Bachelor's in Computer Science or equivalent"],
  "minYearsExperience": number of minimum years required (e.g. 3, 5, 0),
  "keywords": ["5-10 core domain keywords"]
}`;

  const aiResult = await generateJSONCompletion<ExtractedJobRequirements>(
    prompt,
    "You are an expert HR job description analyzer. Extract clean, actionable ATS evaluation criteria without fluff."
  );

  if (aiResult && aiResult.requiredSkills && aiResult.requiredSkills.length > 0) {
    let expLevel: ExperienceLevel = '3–5 years';
    const yrs = aiResult.minYearsExperience || 0;
    if (yrs === 0) expLevel = 'Fresher';
    else if (yrs <= 1) expLevel = '0–1 years';
    else if (yrs <= 3) expLevel = '1–3 years';
    else if (yrs <= 5) expLevel = '3–5 years';
    else if (yrs <= 8) expLevel = '5–8 years';
    else expLevel = '8+ years';

    return {
      title: aiResult.title || undefined,
      department: aiResult.department || 'Engineering',
      location: aiResult.location || 'Remote',
      requiredSkills: normalizeSkillsList(aiResult.requiredSkills),
      preferredSkills: normalizeSkillsList(aiResult.preferredSkills || []),
      responsibilities: aiResult.responsibilities || [],
      educationRequirements: aiResult.educationRequirements || ["Bachelor's degree in Computer Science or related field"],
      minYearsExperience: yrs,
      experienceLevel: expLevel,
      keywords: aiResult.keywords || []
    };
  }

  // Fallback heuristic extraction
  return extractJobRequirementsHeuristic(rawText);
}

export function extractJobRequirementsHeuristic(rawText: string): ExtractedJobRequirements {
  const commonTech = [
    'Java', 'Spring Boot', 'REST API', 'SQL', 'Git', 'Docker', 'Kubernetes', 'AWS',
    'PostgreSQL', 'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Go',
    'Express.js', 'MongoDB', 'Redis', 'GraphQL', 'Microservices', 'CI/CD', 'Linux'
  ];

  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];

  // Check required skills section
  const reqMatch = rawText.match(/(?:Required Skills|Requirements|Must Have|Basic Qualifications)[:\s]*\n([\s\S]*?)(?=\nPreferred|\nResponsibilities|\nBenefits|$)/i);
  const prefMatch = rawText.match(/(?:Preferred Skills|Nice to Have|Bonus|Desired Qualifications)[:\s]*\n([\s\S]*?)(?=\nRequirements|\nResponsibilities|\nBenefits|$)/i);

  for (const tech of commonTech) {
    const reg = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (prefMatch && reg.test(prefMatch[1])) {
      preferredSkills.push(normalizeSkill(tech));
    } else if (reg.test(rawText)) {
      requiredSkills.push(normalizeSkill(tech));
    }
  }

  // Extract years experience
  let minYears = 3;
  const expMatch = rawText.match(/(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)(?:\s*of\s*experience)?/i);
  if (expMatch) {
    minYears = parseInt(expMatch[1], 10);
  }

  let expLevel: ExperienceLevel = '3–5 years';
  if (minYears <= 0) expLevel = 'Fresher';
  else if (minYears <= 1) expLevel = '0–1 years';
  else if (minYears <= 3) expLevel = '1–3 years';
  else if (minYears <= 5) expLevel = '3–5 years';
  else if (minYears <= 8) expLevel = '5–8 years';
  else expLevel = '8+ years';

  // Responsibilities
  const respMatch = rawText.match(/(?:Responsibilities|What You'll Do|Role Overview)[:\s]*\n([\s\S]*?)(?=\nRequirements|\nSkills|\nBenefits|$)/i);
  let responsibilities: string[] = [];
  if (respMatch && respMatch[1]) {
    responsibilities = respMatch[1]
      .split('\n')
      .map(l => l.replace(/^[-•*]\s*/, '').trim())
      .filter(l => l.length > 10)
      .slice(0, 5);
  }
  if (responsibilities.length === 0) {
    responsibilities = [
      'Design, develop, and maintain mission-critical scalable software services.',
      'Collaborate with cross-functional teams to specify, architect, and ship high-impact features.',
      'Write clean, well-tested, and efficient production code adhering to standards.',
      'Participate in code reviews, technical discussions, and architectural planning.'
    ];
  }

  return {
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['Java', 'Spring Boot', 'REST API', 'SQL', 'Git'],
    preferredSkills: preferredSkills.length > 0 ? preferredSkills : ['AWS', 'Docker', 'Kubernetes'],
    responsibilities,
    educationRequirements: ["Bachelor's degree in Computer Science or related technical discipline"],
    minYearsExperience: minYears,
    experienceLevel: expLevel,
    keywords: ['Scalability', 'APIs', 'Architecture', 'Security', 'Testing']
  };
}
