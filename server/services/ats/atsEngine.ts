import { Job, Candidate, ResumeAnalysis, ScoringWeights, ScoreBreakdown, SkillEvidence } from '../../../src/types/ats';
import { areSkillsMatching, normalizeSkill } from '../skillNormalizer';
import { generateJSONCompletion } from '../ai/aiProvider';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  requiredSkills: 30,
  experience: 20,
  responsibilities: 15,
  preferredSkills: 10,
  projects: 10,
  education: 5,
  certifications: 5,
  relevance: 5,
};

/**
 * Analyzes candidate resume against a specific job application
 */
export async function analyzeResumeForJob(
  candidate: Candidate,
  job: Job,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): Promise<ResumeAnalysis> {
  // Try AI Analysis first
  try {
    const aiAnalysis = await runAiResumeAnalysis(candidate, job, weights);
    if (aiAnalysis) {
      return aiAnalysis;
    }
  } catch (err) {
    console.warn('AI ATS analysis failed or unavailable, falling back to deterministic engine:', err);
  }

  // Fallback Deterministic ATS Engine
  return runDeterministicAtsAnalysis(candidate, job, weights);
}

/**
 * AI-powered resume screening and matching using gemini-3.8-flash
 */
async function runAiResumeAnalysis(
  candidate: Candidate,
  job: Job,
  weights: ScoringWeights
): Promise<ResumeAnalysis | null> {
  const prompt = `You are a recruitment ATS and talent screening intelligence system.
Compare this Candidate Resume against the specific Job Opening.
You must adhere strictly to responsible AI guidelines:
- Never hallucinate or invent skills, companies, dates, or degrees not mentioned in the resume.
- Distinguish between "Found", "Not Found", and "Unclear".
- Cite concrete evidence quotes or context from the resume.

JOB REQUIREMENTS:
Title: ${job.title}
Department: ${job.department}
Min Experience: ${job.minYearsExperience} years
Required Skills: ${job.requiredSkills.join(', ')}
Preferred Skills: ${job.preferredSkills.join(', ')}
Responsibilities:
${job.responsibilities.map(r => '- ' + r).join('\n')}
Education Requirements: ${job.educationRequirements.join(', ')}

CANDIDATE RESUME:
Name: ${candidate.name}
Total Experience: ${candidate.totalExperienceYears} years
Candidate Skills: ${candidate.skills.join(', ')}
Work History:
${candidate.experienceTimeline.map(e => `${e.title} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description}`).join('\n')}
Education:
${candidate.education.map(ed => `${ed.degree} from ${ed.institution} (${ed.graduationYear || ''})`).join('\n')}
Projects:
${candidate.projects.map(p => `${p.title}: ${p.description}`).join('\n')}
Certifications: ${candidate.certifications.join(', ') || 'None listed'}
Resume Text:
"""
${candidate.originalResumeText.slice(0, 3000)}
"""

Calculate an ATS score according to these weights (Sum = 100):
- Required Skills: max ${weights.requiredSkills}
- Experience: max ${weights.experience}
- Responsibilities Alignment: max ${weights.responsibilities}
- Preferred Skills: max ${weights.preferredSkills}
- Projects Relevance: max ${weights.projects}
- Education: max ${weights.education}
- Certifications: max ${weights.certifications}
- Semantic Relevance: max ${weights.relevance}

Return ONLY valid JSON matching this schema:
{
  "overallScore": number (0-100, sum of category points),
  "breakdown": {
    "requiredSkills": {
      "score": number (0 to ${weights.requiredSkills}),
      "matched": ["list of job required skills found in resume"],
      "missing": ["list of job required skills NOT found in resume"],
      "partial": ["list of skills with partial/tangential match"]
    },
    "experience": {
      "score": number (0 to ${weights.experience}),
      "candidateYears": ${candidate.totalExperienceYears},
      "requiredYears": ${job.minYearsExperience},
      "matchLevel": "Strong" | "Moderate" | "Weak"
    },
    "responsibilities": {
      "score": number (0 to ${weights.responsibilities}),
      "alignment": "High" | "Medium" | "Low"
    },
    "preferredSkills": {
      "score": number (0 to ${weights.preferredSkills}),
      "matched": ["matched preferred skills"],
      "missing": ["missing preferred skills"]
    },
    "projects": {
      "score": number (0 to ${weights.projects}),
      "relevantCount": number
    },
    "education": {
      "score": number (0 to ${weights.education}),
      "matchLevel": "Strong" | "Moderate" | "Weak",
      "degree": "Candidate degree summary"
    },
    "certifications": {
      "score": number (0 to ${weights.certifications}),
      "items": ["relevant certifications found"]
    },
    "relevance": {
      "score": number (0 to ${weights.relevance}),
      "semanticScore": number
    }
  },
  "aiSummary": "2-4 sentence concise professional summary for recruiter",
  "recommendation": "Strong Match" | "Good Match" | "Moderate Match" | "Weak Match",
  "strengths": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "gaps": ["gap 1", "gap 2"],
  "whyThisScore": {
    "positives": ["+ Positive reason with data", "+ Positive reason"],
    "negatives": ["- Missing requirement or area needing review"]
  },
  "skillEvidences": [
    {
      "skill": "Skill name",
      "status": "matched" | "missing" | "partial",
      "source": "Exact brief quote or context from candidate resume or 'Not identified in provided resume'",
      "confidence": 0.95
    }
  ]
}`;

  const aiResult = await generateJSONCompletion<any>(prompt);
  if (!aiResult || typeof aiResult.overallScore !== 'number') {
    return null;
  }

  // Ensure overallScore is integer within 0-100
  const overallScore = Math.min(100, Math.max(0, Math.round(aiResult.overallScore)));

  return {
    id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    applicationId: '',
    overallScore,
    breakdown: {
      requiredSkills: {
        score: Math.min(weights.requiredSkills, Math.round(aiResult.breakdown?.requiredSkills?.score ?? 0)),
        max: weights.requiredSkills,
        matched: aiResult.breakdown?.requiredSkills?.matched || [],
        missing: aiResult.breakdown?.requiredSkills?.missing || [],
        partial: aiResult.breakdown?.requiredSkills?.partial || []
      },
      experience: {
        score: Math.min(weights.experience, Math.round(aiResult.breakdown?.experience?.score ?? 0)),
        max: weights.experience,
        candidateYears: candidate.totalExperienceYears,
        requiredYears: job.minYearsExperience,
        matchLevel: aiResult.breakdown?.experience?.matchLevel || 'Moderate'
      },
      responsibilities: {
        score: Math.min(weights.responsibilities, Math.round(aiResult.breakdown?.responsibilities?.score ?? 0)),
        max: weights.responsibilities,
        alignment: aiResult.breakdown?.responsibilities?.alignment || 'Medium'
      },
      preferredSkills: {
        score: Math.min(weights.preferredSkills, Math.round(aiResult.breakdown?.preferredSkills?.score ?? 0)),
        max: weights.preferredSkills,
        matched: aiResult.breakdown?.preferredSkills?.matched || [],
        missing: aiResult.breakdown?.preferredSkills?.missing || []
      },
      projects: {
        score: Math.min(weights.projects, Math.round(aiResult.breakdown?.projects?.score ?? 0)),
        max: weights.projects,
        relevantCount: aiResult.breakdown?.projects?.relevantCount || 1
      },
      education: {
        score: Math.min(weights.education, Math.round(aiResult.breakdown?.education?.score ?? 0)),
        max: weights.education,
        matchLevel: aiResult.breakdown?.education?.matchLevel || 'Strong',
        degree: aiResult.breakdown?.education?.degree || candidate.education[0]?.degree || "Bachelor's Degree"
      },
      certifications: {
        score: Math.min(weights.certifications, Math.round(aiResult.breakdown?.certifications?.score ?? 0)),
        max: weights.certifications,
        items: aiResult.breakdown?.certifications?.items || []
      },
      relevance: {
        score: Math.min(weights.relevance, Math.round(aiResult.breakdown?.relevance?.score ?? 0)),
        max: weights.relevance,
        semanticScore: aiResult.breakdown?.relevance?.semanticScore || 80
      }
    },
    aiSummary: aiResult.aiSummary || `${candidate.name} presents relevant background for the ${job.title} role.`,
    recommendation: aiResult.recommendation || (overallScore >= 80 ? 'Strong Match' : overallScore >= 65 ? 'Good Match' : overallScore >= 50 ? 'Moderate Match' : 'Weak Match'),
    strengths: aiResult.strengths || [],
    gaps: aiResult.gaps || [],
    whyThisScore: aiResult.whyThisScore || {
      positives: [`+ Identified ${aiResult.breakdown?.requiredSkills?.matched?.length || 0} matching core skills`],
      negatives: [`- Some requirements not identified in the provided resume.`]
    },
    skillEvidences: aiResult.skillEvidences || [],
    isAiGenerated: true,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Deterministic Fallback ATS Algorithm
 */
export function runDeterministicAtsAnalysis(
  candidate: Candidate,
  job: Job,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ResumeAnalysis {
  const resumeText = candidate.originalResumeText.toLowerCase();

  // 1. Required Skills Matching
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];
  const partialRequired: string[] = [];
  const skillEvidences: SkillEvidence[] = [];

  for (const skill of job.requiredSkills) {
    const isDirectMatch = candidate.skills.some(cs => areSkillsMatching(cs, skill));
    const isTextMatch = resumeText.includes(skill.toLowerCase());

    if (isDirectMatch || isTextMatch) {
      matchedRequired.push(skill);
      skillEvidences.push({
        skill,
        status: 'matched',
        source: `Found under candidate skills and work experience mentioning ${skill}`,
        confidence: 0.95
      });
    } else {
      missingRequired.push(skill);
      skillEvidences.push({
        skill,
        status: 'missing',
        source: 'Not identified in the provided resume.',
        confidence: 0.9
      });
    }
  }

  const reqSkillRatio = job.requiredSkills.length > 0
    ? matchedRequired.length / job.requiredSkills.length
    : 1;
  const reqSkillScore = Math.round(reqSkillRatio * weights.requiredSkills);

  // 2. Preferred Skills Matching
  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];

  for (const skill of job.preferredSkills) {
    const isDirectMatch = candidate.skills.some(cs => areSkillsMatching(cs, skill));
    const isTextMatch = resumeText.includes(skill.toLowerCase());

    if (isDirectMatch || isTextMatch) {
      matchedPreferred.push(skill);
      skillEvidences.push({
        skill,
        status: 'matched',
        source: `Preferred skill verified in profile`,
        confidence: 0.9
      });
    } else {
      missingPreferred.push(skill);
      skillEvidences.push({
        skill,
        status: 'missing',
        source: 'Not identified in the provided resume.',
        confidence: 0.85
      });
    }
  }

  const prefSkillRatio = job.preferredSkills.length > 0
    ? matchedPreferred.length / job.preferredSkills.length
    : 0.5;
  const prefSkillScore = Math.round(prefSkillRatio * weights.preferredSkills);

  // 3. Experience Matching
  const reqYrs = job.minYearsExperience || 1;
  const candYrs = candidate.totalExperienceYears;
  let expScore = 0;
  let expMatchLevel: 'Strong' | 'Moderate' | 'Weak' = 'Moderate';

  if (candYrs >= reqYrs * 1.2) {
    expScore = weights.experience;
    expMatchLevel = 'Strong';
  } else if (candYrs >= reqYrs) {
    expScore = Math.round(weights.experience * 0.9);
    expMatchLevel = 'Strong';
  } else if (candYrs >= reqYrs * 0.7) {
    expScore = Math.round(weights.experience * 0.7);
    expMatchLevel = 'Moderate';
  } else {
    expScore = Math.round(weights.experience * 0.4);
    expMatchLevel = 'Weak';
  }

  // 4. Responsibilities Alignment
  let respScore = Math.round(weights.responsibilities * 0.8);
  let alignment = 'High';
  if (reqSkillRatio < 0.6) {
    respScore = Math.round(weights.responsibilities * 0.5);
    alignment = 'Medium';
  }

  // 5. Projects
  let projScore = Math.round(weights.projects * 0.85);
  let relProjectsCount = candidate.projects.length;
  if (relProjectsCount === 0) {
    projScore = Math.round(weights.projects * 0.4);
  }

  // 6. Education
  let eduScore = weights.education;
  let eduMatchLevel: 'Strong' | 'Moderate' | 'Weak' = 'Strong';
  const hasCS = candidate.education.some(e =>
    /computer|software|engineering|technology|science|information/i.test(e.degree + ' ' + (e.field || ''))
  );
  if (!hasCS && candidate.education.length > 0) {
    eduScore = Math.round(weights.education * 0.8);
    eduMatchLevel = 'Moderate';
  }

  // 7. Certifications
  let certScore = 0;
  if (candidate.certifications && candidate.certifications.length > 0) {
    certScore = weights.certifications;
  } else {
    certScore = Math.round(weights.certifications * 0.5);
  }

  // 8. Keyword Relevance
  const relevanceScore = Math.round(weights.relevance * Math.min(1, reqSkillRatio * 0.7 + (candYrs >= reqYrs ? 0.3 : 0.1)));

  // Total
  const overallScore = Math.min(100, Math.max(0,
    reqSkillScore + expScore + respScore + prefSkillScore + projScore + eduScore + certScore + relevanceScore
  ));

  // Recommendation
  let recommendation: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Weak Match' = 'Moderate Match';
  if (overallScore >= 85) recommendation = 'Strong Match';
  else if (overallScore >= 70) recommendation = 'Good Match';
  else if (overallScore >= 55) recommendation = 'Moderate Match';
  else recommendation = 'Weak Match';

  // Positives & Negatives for "Why this score"
  const positives: string[] = [];
  const negatives: string[] = [];

  positives.push(`+ Matched ${matchedRequired.length} of ${job.requiredSkills.length} required skills (${matchedRequired.slice(0, 4).join(', ')})`);
  if (candYrs >= reqYrs) {
    positives.push(`+ Has ${candYrs} years experience (meets or exceeds ${reqYrs} years requirement)`);
  }
  if (matchedPreferred.length > 0) {
    positives.push(`+ Demonstrates ${matchedPreferred.length} preferred bonus skills (${matchedPreferred.join(', ')})`);
  }
  if (candidate.projects.length > 0) {
    positives.push(`+ Relevant project portfolio demonstrated in profile`);
  }

  if (missingRequired.length > 0) {
    negatives.push(`- Missing required skills: ${missingRequired.join(', ')} not identified in resume`);
  }
  if (candYrs < reqYrs) {
    negatives.push(`- Below requested experience threshold (${candYrs} yrs vs ${reqYrs} yrs required)`);
  }
  if (missingPreferred.length > 0 && missingRequired.length === 0) {
    negatives.push(`- Preferred skills not found: ${missingPreferred.slice(0, 3).join(', ')}`);
  }

  const aiSummary = `${candidate.name} is assessed as a ${recommendation.toLowerCase()} for the ${job.title} role with an ATS score of ${overallScore}/100. Demonstrated strength in ${matchedRequired.slice(0, 3).join(', ') || 'technical fundamentals'} and ${candYrs} years of experience. ${missingRequired.length > 0 ? `Key gap: ${missingRequired.slice(0, 2).join(', ')} was not identified in the provided resume.` : 'All primary required qualifications were satisfied.'}`;

  return {
    id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    applicationId: '',
    overallScore,
    breakdown: {
      requiredSkills: {
        score: reqSkillScore,
        max: weights.requiredSkills,
        matched: matchedRequired,
        missing: missingRequired,
        partial: partialRequired
      },
      experience: {
        score: expScore,
        max: weights.experience,
        candidateYears: candYrs,
        requiredYears: reqYrs,
        matchLevel: expMatchLevel
      },
      responsibilities: {
        score: respScore,
        max: weights.responsibilities,
        alignment
      },
      preferredSkills: {
        score: prefSkillScore,
        max: weights.preferredSkills,
        matched: matchedPreferred,
        missing: missingPreferred
      },
      projects: {
        score: projScore,
        max: weights.projects,
        relevantCount: candidate.projects.length
      },
      education: {
        score: eduScore,
        max: weights.education,
        matchLevel: eduMatchLevel,
        degree: candidate.education[0]?.degree || "Bachelor's Degree in Computer Science"
      },
      certifications: {
        score: certScore,
        max: weights.certifications,
        items: candidate.certifications
      },
      relevance: {
        score: relevanceScore,
        max: weights.relevance,
        semanticScore: Math.round(reqSkillRatio * 100)
      }
    },
    aiSummary,
    recommendation,
    strengths: positives.map(p => p.replace(/^\+\s*/, '')),
    gaps: negatives.map(n => n.replace(/^-\s*/, '')),
    whyThisScore: {
      positives,
      negatives
    },
    skillEvidences,
    isAiGenerated: false,
    analyzedAt: new Date().toISOString()
  };
}
