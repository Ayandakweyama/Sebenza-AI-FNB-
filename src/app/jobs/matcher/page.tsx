'use client';

import { useEffect, useMemo, useState } from 'react';
import { Upload, Sparkles, Loader2, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractTextFromFile } from '@/lib/fileTextExtractor';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  postedDate?: string;
  description?: string;
  jobType?: string;
  industry?: string;
  reference?: string;
  source?: string;
};

type MatchResult = Job & {
  score: number;
  matches: string[];
  missing: string[];
  explanation: string;
};

export default function JobMatcherPage() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [query, setQuery] = useState('Software Engineer');
  const [location, setLocation] = useState('South Africa');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [jobNotes, setJobNotes] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const snapshot = data.profileSnapshot;
        if (!snapshot) return;

        const suggestedQuery = snapshot.jobTitle || snapshot.jobTypes?.[0] || '';
        const suggestedLocation = snapshot.location || '';
        if (suggestedQuery) setQuery(suggestedQuery);
        if (suggestedLocation) setLocation(suggestedLocation);
      } catch {}
    })();
  }, []);

  const canMatch = useMemo(() => {
    return cvText.trim().length > 50 && query.trim().length > 1 && location.trim().length > 1;
  }, [cvText, query, location]);

  const handleCvUpload = async (file: File) => {
    setCvFile(file);
    setIsExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setCvText(text);
      toast.success('CV uploaded and parsed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse CV');
    } finally {
      setIsExtracting(false);
    }
  };

  const scrapeJobs = async () => {
    setIsScraping(true);
    try {
      const response = await fetch('/api/scrape-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location,
          maxPages: 1,
          sources: ['indeed', 'jobmail']
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to scrape jobs');
      }

      const scraped = (data.jobs || []) as Job[];
      setJobs(scraped);
      toast.success(`Found ${scraped.length} jobs`);
      return scraped;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to scrape jobs');
      return [];
    } finally {
      setIsScraping(false);
    }
  };

  const matchJobs = async () => {
    if (!canMatch) {
      toast.error('Upload a CV and add a query/location first');
      return;
    }

    setIsMatching(true);
    try {
      const scraped = jobs.length ? jobs : await scrapeJobs();
      if (!scraped.length) return;

      const response = await fetch('/api/jobs/matcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cvText,
          jobs: scraped.slice(0, 25),
          maxJobs: 20
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to match jobs');
      }

      setResults((data.results || []) as MatchResult[]);
      toast.success('Job matching complete');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to match jobs');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Upload className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Upload Your CV</div>
              <div className="text-sm text-slate-400">PDF, DOC, DOCX, TXT</div>
            </div>
          </div>

          <div className="mt-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              id="job-matcher-cv-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleCvUpload(file);
              }}
            />
            <Button asChild variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-700">
              <label htmlFor="job-matcher-cv-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {cvFile ? 'Upload Different CV' : 'Upload CV'}
              </label>
            </Button>

            {isExtracting && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-purple-300" />
                Extracting text...
              </div>
            )}

            {cvFile && !isExtracting && (
              <div className="mt-3 text-sm text-slate-300 truncate">
                {cvFile.name}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="CV text will appear here after upload. You can edit it if needed."
              className="min-h-40 bg-slate-950/50 border-slate-700 text-slate-200"
            />
            <div className="mt-2 text-xs text-slate-400">{cvText.length} characters</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
              <Search className="h-5 w-5 text-pink-300" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Find Matches</div>
              <div className="text-sm text-slate-400">Scrape and rank jobs from multiple sources</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">Search Query</div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-slate-950/50 border-slate-700 text-slate-200"
                placeholder="e.g. Project Manager, Sales Representative"
              />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Location</div>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-slate-950/50 border-slate-700 text-slate-200"
                placeholder="e.g. Johannesburg, South Africa"
              />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Notes (optional)</div>
              <Input
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                className="bg-slate-950/50 border-slate-700 text-slate-200"
                placeholder="Any preferences (remote, salary, industry)..."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
              disabled={isScraping || !query.trim() || !location.trim()}
              onClick={() => void scrapeJobs()}
            >
              {isScraping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Scrape Jobs
            </Button>
            <Button
              className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-600"
              disabled={!canMatch || isMatching}
              onClick={() => void matchJobs()}
            >
              {isMatching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Upload and Match
            </Button>
          </div>

          <div className="mt-4 text-sm text-slate-300">
            {jobs.length > 0 ? `${jobs.length} jobs scraped` : 'Scrape jobs, then match using your CV'}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">Best Matches</div>
            <div className="text-sm text-slate-400">Highest likelihood matches based on your CV and job requirements</div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-4 text-sm text-slate-400">
            No matches yet. Upload a CV and run matching to see results.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4">
            {results.map((job, index) => (
              <div
                key={`${job.id || ''}-${job.url || ''}-${job.title || ''}-${job.company || ''}-${index}`}
                className="rounded-xl border border-slate-700 bg-slate-950/40 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{job.title}</div>
                    <div className="text-sm text-slate-400">
                      {job.company} · {job.location} {job.source ? `· ${job.source}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-300">
                      <span className="text-slate-400">Score</span>{' '}
                      <span className="font-semibold text-white">{job.score}%</span>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      <a href={job.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply
                      </a>
                    </Button>
                  </div>
                </div>

                {job.explanation && (
                  <div className="mt-3 text-sm text-slate-200">
                    {job.explanation}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
                    <div className="text-xs text-slate-400 mb-2">What matches</div>
                    <div className="flex flex-wrap gap-2">
                      {(job.matches || []).slice(0, 10).map((m, i) => (
                        <span key={`${m}-${i}`} className="text-xs px-2 py-1 rounded-full bg-green-900/40 text-green-200 border border-green-900/50">
                          {m}
                        </span>
                      ))}
                      {(job.matches || []).length === 0 && (
                        <span className="text-xs text-slate-400">Not available</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
                    <div className="text-xs text-slate-400 mb-2">What doesn't match</div>
                    <div className="flex flex-wrap gap-2">
                      {(job.missing || []).slice(0, 10).map((m, i) => (
                        <span key={`${m}-${i}`} className="text-xs px-2 py-1 rounded-full bg-red-900/30 text-red-200 border border-red-900/50">
                          {m}
                        </span>
                      ))}
                      {(job.missing || []).length === 0 && (
                        <span className="text-xs text-slate-400">Not available</span>
                      )}
                    </div>
                  </div>
                </div>

                {job.description && (
                  <div className="mt-4">
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-slate-300 hover:text-white">
                        View job description
                      </summary>
                      <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200 bg-slate-900/30 border border-slate-800 rounded-lg p-3">
                        {job.description}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
