import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, ShieldCheck, FileText, ArrowRight, Zap, Target,
  Users, BarChart3, ChevronDown, ChevronUp, Lock, Brain, HelpCircle
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenLogin }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does the ATS score get calculated?',
      a: 'The score is a transparent, explainable 0–100 scale based on 8 weighted factors: Required Skills (30%), Experience Relevance (20%), Responsibilities Alignment (15%), Preferred Skills (10%), Projects (10%), Education (5%), Certifications (5%), and Semantic Relevance (5%). Weights are customizable per job.'
    },
    {
      q: 'How does the platform prevent AI hallucinations?',
      a: 'The system strictly distinguishes between Found, Not Found, and Unclear. Every evaluation factor is anchored to verifiable extracted quotes from the candidate resume. If a skill or experience is absent, the system flags it as "Not identified in provided resume" rather than making unverified assumptions.'
    },
    {
      q: 'Which resume formats are supported?',
      a: 'You can upload PDF, DOCX, and TXT files, both individually and in bulk (up to 25 resumes at once). You can also directly paste resume text for immediate ad-hoc screening.'
    },
    {
      q: 'Does candidate ranking change if applied to different jobs?',
      a: 'Yes. ATS scores are job-specific. The same candidate may score 94% for a Senior Java Engineer role, but 65% for a Data Scientist role, reflecting true job-relevant qualifications.'
    },
    {
      q: 'Are protected demographics used in candidate scoring?',
      a: 'Never. The platform strictly excludes race, gender, age, disability, photo, marital status, and political beliefs. All scoring is purely qualification-based.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              AI
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                AI ATS
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-2 border border-indigo-100">
                Screen & Rank
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Enter Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Explainable AI Resume Screening & Candidate Ranking
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Hire Smarter. <span className="text-indigo-600">Screen Faster.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AI-powered resume screening that parses applicant documents, calculates an explainable 0–100 match score against your job description, and ranks top talent in seconds.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-7 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            Launch ATS Platform
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            HR Recruiter Login
          </button>
        </div>

        {/* Live Mini Preview Card */}
        <div className="mt-14 max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-800">
                Active ATS Screening Demo: Software Engineer (Java & Cloud)
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Score: 94 / 100 • Strong Match
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-500 block mb-1">Required Skills (30%)</span>
              <p className="font-bold text-slate-900">30 / 30 pts</p>
              <p className="text-[11px] text-emerald-600 mt-1">✓ Java, Spring Boot, REST API, SQL, Git</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-500 block mb-1">Experience (20%)</span>
              <p className="font-bold text-slate-900">20 / 20 pts</p>
              <p className="text-[11px] text-emerald-600 mt-1">✓ 4.5 yrs vs 3 yrs required</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-500 block mb-1">Bonus Skills (10%)</span>
              <p className="font-bold text-slate-900">9 / 10 pts</p>
              <p className="text-[11px] text-emerald-600 mt-1">✓ AWS, Docker, Kubernetes</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Evidence cited directly from applicant resume</span>
            <span className="text-indigo-600 font-semibold">Zero Hallucinations</span>
          </div>
        </div>
      </section>

      {/* How it works 4-step workflow */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How the AI ATS Workflow Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              From job description to final interview shortlist in four transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 relative">
              <span className="text-2xl font-black text-indigo-600/30 absolute top-4 right-4">01</span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Create Job & Criteria</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paste your Job Description or enter structured required and preferred skills with minimum experience thresholds.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 relative">
              <span className="text-2xl font-black text-indigo-600/30 absolute top-4 right-4">02</span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Resumes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag and drop PDF, DOCX, or TXT resumes. The parser extracts text, detects duplicates, and normalizes skills.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 relative">
              <span className="text-2xl font-black text-indigo-600/30 absolute top-4 right-4">03</span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">ATS & AI Evaluation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computes transparent 8-category match scores with evidence citations from the resume and recruiter summaries.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 relative">
              <span className="text-2xl font-black text-indigo-600/30 absolute top-4 right-4">04</span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Rank & Shortlist</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sort candidates by score (#1, #2, #3), filter by threshold, compare side-by-side, and move to interview.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8-Factor Explainable Scoring Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Explainable ATS Scoring Model (100% Weight)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            No black-box algorithms. Every score component is auditable and configurable.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-indigo-600">30%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Required Skills</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Strict non-negotiable tech stack matching</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-blue-600">20%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Relevant Experience</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Duration in matching domain roles</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-emerald-600">15%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Responsibilities</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Alignment with day-to-day deliverables</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-teal-600">10%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Preferred Skills</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Nice-to-have bonus proficiencies</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-indigo-600">10%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Projects</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Demonstrated real-world project work</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-purple-600">5%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Education</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Equivalent technical degree check</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-amber-600">5%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Certifications</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Industry certifications (AWS, CKA, etc.)</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xl font-bold text-rose-600">5%</span>
            <h4 className="text-xs font-bold text-slate-900 mt-1">Semantic Relevance</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Contextual vocabulary & domain fit</p>
          </div>
        </div>
      </section>

      {/* Security & Non-discrimination */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Responsible AI & Multi-Tenant Privacy</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mt-2 leading-relaxed">
            Applicant data is treated with enterprise privacy standards. Our AI models never evaluate protected demographics (race, gender, age, disability, photos), and organization candidate pools are strictly isolated.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-bold text-slate-900 hover:bg-slate-50"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <p>© 2026 AI ATS — Smart Resume Screening & Candidate Ranking System. Built for modern recruitment teams.</p>
      </footer>
    </div>
  );
};
