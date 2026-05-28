'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { Brain, FileUp, Loader2, MapPin, Search, Sparkles, Target } from 'lucide-react';
import { extractTextFromFile } from '@/lib/fileTextExtractor';
import { useProfile } from '@/contexts/ProfileContext';

type MissingSkill = {
  name: string;
  description?: string;
  category?: string;
  importance?: string;
  reason?: string;
};

type MatchingSkill = {
  name: string;
  description?: string;
  category?: string;
  context?: string;
};

type MatchedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  description?: string;
  source: string;
  matchScore: number;
  feedbackLikelihood: number;
  matchReason: string;
  missingSkills?: MissingSkill[];
  matchingSkills?: MatchingSkill[];
};

type MatchResponse = {
  matchedJobs: MatchedJob[];
  totalScraped: number;
  sourcesUsed: string[];
  diagnostics?: Record<string, any>;
  candidateProfile?: {
    skills: string[];
    experienceCount: number;
    educationCount: number;
    yearsOfExperience: string;
  };
  message?: string;
  errors?: string[];
};

function buildCvTextFromProfile(profile: any) {
  if (!profile) return '';

  const parts: string[] = [];

  if (profile.firstName || profile.lastName) parts.push(`${profile.firstName || ''} ${profile.lastName || ''}`.trim());
  if (profile.email) parts.push(String(profile.email));
  if (profile.location) parts.push(String(profile.location));
  if (profile.bio) parts.push(`Bio:\n${String(profile.bio)}`);

  const jobTitle = profile.jobTitle || profile.goals?.jobTitle;
  if (jobTitle) parts.push(`Target role: ${String(jobTitle)}`);

  const industries = profile.industries || profile.jobPreferences?.industries || profile.goals?.industries;
  if (Array.isArray(industries) && industries.length) parts.push(`Industries: ${industries.join(', ')}`);

  const technicalSkills = profile.technicalSkills;
  if (Array.isArray(technicalSkills) && technicalSkills.length) {
    parts.push(`Skills: ${technicalSkills.map((s: any) => s?.name || s).filter(Boolean).join(', ')}`);
  }

  if (Array.isArray(profile.education) && profile.education.length) {
    parts.push(
      `Education:\n${profile.education
        .map((e: any) => [e.degree, e.fieldOfStudy, e.institution, e.startDate, e.endDate].filter(Boolean).join(' · '))
        .filter(Boolean)
        .join('\n')}`
    );
  }

  const experience = profile.workExperience || profile.experience;
  if (Array.isArray(experience) && experience.length) {
    parts.push(
      `Experience:\n${experience
        .map((w: any) => [w.title, w.company, w.startDate, w.endDate, w.description].filter(Boolean).join(' · '))
        .filter(Boolean)
        .join('\n')}`
    );
  }

  return parts.join('\n\n').trim();
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-200 border-emerald-500/25 bg-emerald-500/10';
  if (score >= 60) return 'text-blue-200 border-blue-500/25 bg-blue-500/10';
  if (score >= 40) return 'text-amber-200 border-amber-500/25 bg-amber-500/10';
  return 'text-red-200 border-red-500/25 bg-red-500/10';
}

export default function JobMatcherPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile } = useProfile();

  const defaultQuery = useMemo(() => String((profile as any)?.jobTitle || (profile as any)?.goals?.jobTitle || 'software engineer'), [profile]);
  const [query, setQuery] = useState(defaultQuery);
  const [location, setLocation] = useState('South Africa');
  const [yearsOfExperience, setYearsOfExperience] = useState<string>('');
  const [maxResults, setMaxResults] = useState<number>(20);

  const profileCvText = useMemo(() => buildCvTextFromProfile(profile), [profile]);
  const [cvText, setCvText] = useState<string>('');
  const [cvFileName, setCvFileName] = useState<string>('');

  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResponse | null>(null);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  const effectiveCvText = (cvText || profileCvText).trim();

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setCvFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      setCvText(text);
    } catch (e: any) {
      setCvText('');
      setCvFileName('');
      setError(e?.message || 'Failed to read CV');
    }
  };

  const runMatch = async () => {
    setError(null);
    setResult(null);

    if (!isLoaded) return;
    if (!isSignedIn) {
      setError('Please sign in to use Job Matcher.');
      return;
    }
    if (!query.trim()) {
      setError('Enter a search query.');
      return;
    }
    if (!effectiveCvText) {
      setError('Add profile info (Education/Experience) or upload a Word CV to run matching.');
      return;
    }

    setIsMatching(true);
    try {
      const res = await fetch('/api/job-matcher/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cvText: effectiveCvText,
          query: query.trim(),
          location: location.trim() || 'South Africa',
          yearsOfExperience: yearsOfExperience || undefined,
          maxResults,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error || 'Matching failed');
      setResult(data as MatchResponse);
    } catch (e: any) {
      setError(e?.message || 'Matching failed');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-85"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 10% 10%, rgba(59,130,246,.22) 0%, transparent 62%), radial-gradient(ellipse 60% 55% at 90% 20%, rgba(255,255,255,.08) 0%, transparent 60%)',
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-300" />
                AI Job Matcher
              </div>
              <div className="mt-2 text-sm text-slate-200/80">
                Match scoring uses your profile (or a Word CV upload) plus the jobs you search for right now.
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/10 text-xs text-slate-200/80">
              <Sparkles className="w-4 h-4 text-blue-300" />
              ATS + relevance + response likelihood
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-300" />
                Search
              </div>
              <div className="mt-3 space-y-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. data analyst"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-200/70" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="South Africa"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="">Experience</option>
                    <option value="0-1">0-1</option>
                    <option value="1-3">1-3</option>
                    <option value="3-5">3-5</option>
                    <option value="5-10">5-10</option>
                    <option value="10+">10+</option>
                  </select>
                  <select
                    value={String(maxResults)}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="10">10 results</option>
                    <option value="20">20 results</option>
                    <option value="30">30 results</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={runMatch}
                  disabled={isMatching}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#050815] px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-60"
                >
                  {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  Generate match scores
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <FileUp className="w-4 h-4 text-blue-300" />
                Candidate context
              </div>
              <div className="mt-2 text-xs text-slate-200/70">
                Uses your saved profile data automatically. Optionally upload a Word CV (DOC or DOCX) to override.
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/10 text-xs text-slate-200 hover:bg-black/20 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".doc,.docx"
                    className="hidden"
                    onChange={(e) => void onUpload(e.target.files?.[0] || null)}
                  />
                  Upload Word CV
                </label>
                {cvFileName ? <div className="text-xs text-slate-200/70">{cvFileName}</div> : null}
                {!cvFileName && profileCvText ? <div className="text-xs text-slate-200/70">Using profile snapshot</div> : null}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-3">
                <div className="text-[11px] text-slate-200/70">Preview</div>
                <div className="mt-2 text-xs text-slate-100/90 whitespace-pre-wrap line-clamp-6">
                  {effectiveCvText ? effectiveCvText : 'Add education/experience in your profile or upload a Word CV.'}
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>
      </motion.div>

      {result ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-sm font-semibold text-white">Snapshot</div>
              <div className="mt-3 space-y-2 text-sm text-slate-200/80">
                <div className="flex items-center justify-between gap-3">
                  <span>Matches</span>
                  <span className="text-white font-semibold">{result.matchedJobs?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Total scraped</span>
                  <span className="text-white font-semibold">{Number(result.totalScraped || 0).toLocaleString('en-US')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Sources</span>
                  <span className="text-white font-semibold">{(result.sourcesUsed || []).length || 0}</span>
                </div>
              </div>
              {result.candidateProfile ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="text-xs text-slate-200/70">Candidate profile</div>
                  <div className="mt-2 text-sm text-white font-semibold">{result.candidateProfile.yearsOfExperience || '—'} yrs</div>
                  <div className="mt-2 text-xs text-slate-200/80">
                    Skills: {(result.candidateProfile.skills || []).slice(0, 10).join(', ') || '—'}
                  </div>
                </div>
              ) : null}
              {result.message ? <div className="mt-4 text-xs text-slate-200/70">{result.message}</div> : null}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {(result.matchedJobs || []).map((job) => (
              <button
                key={job.id || job.url}
                type="button"
                onClick={() => {
                  if (job.url) window.open(job.url, '_blank', 'noopener,noreferrer');
                }}
                className="w-full text-left rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 hover:bg-white/8 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-white truncate">{job.title}</div>
                    <div className="mt-1 text-sm text-slate-200/80 truncate">
                      {job.company} · {job.location}
                    </div>
                    <div className="mt-2 text-xs text-slate-200/70 line-clamp-2">{job.matchReason}</div>
                  </div>
                  <div className="flex items-end flex-col gap-2 flex-shrink-0">
                    <div className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${scoreColor(job.matchScore)}`}>
                      {Math.round(job.matchScore)}%
                    </div>
                    <div className="text-[11px] text-slate-200/70">Likelihood {Math.round(job.feedbackLikelihood)}%</div>
                  </div>
                </div>

                {(job.missingSkills || []).length ? (
                  <div className="mt-4">
                    <div className="text-[11px] text-slate-200/70">Missing skills</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.missingSkills!.slice(0, 6).map((s) => (
                        <span key={s.name} className="px-2 py-1 rounded-lg bg-black/10 border border-white/10 text-xs text-slate-100">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

