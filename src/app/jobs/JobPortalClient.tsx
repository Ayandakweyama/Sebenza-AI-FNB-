'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { EnhancedJobSearch, SearchParams } from '@/components/Jobs/EnhancedJobSearch';
import { JobSearchResults } from '@/app/components/Jobs/JobSearchResults';
import { useJobScraper, type Job } from '@/hooks/useJobScraper';
import { useJobContext } from '@/contexts/JobContext';
import { SouthAfricaMarketCard } from './components/SouthAfricaMarketCard';
import { CareerInsightsSidebar } from './components/CareerInsightsSidebar';

const dedupeJobs = (jobs: Job[]) => {
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const j of jobs) {
    const key = j.url || j.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(j);
  }
  return out;
};

export default function JobPortalClient() {
  const { applications, savedJobs, jobAlerts } = useJobContext();

  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('South Africa');
  const [sources, setSources] = useState<SearchParams['sources']>(['indeed', 'pnet', 'careerjunction', 'linkedin']);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const lastSearchKeyRef = useRef<string>('');

  const { scrapeAll, jobs, isLoading, error } = useJobScraper();

  const isScraping = isLoading;

  const stableJobs = useMemo(() => dedupeJobs(Array.isArray(jobs) ? jobs : []), [jobs]);

  const sortedJobs = useMemo(() => stableJobs, [stableJobs]);

  const runSearch = useCallback(
    async (params: SearchParams) => {
      setQuery(params.query);
      setLocation(params.location);
      setSources(params.sources);
      setSelectedJob(null);
      setHasSearched(!!params.query.trim());
      lastSearchKeyRef.current = '';
    },
    []
  );

  useEffect(() => {
    if (!hasSearched) return;
    if (!query.trim()) return;
    const key = `${query.trim()}|${location.trim()}|${(sources || []).join(',')}`;
    if (lastSearchKeyRef.current === key) return;
    lastSearchKeyRef.current = key;
    void scrapeAll({ query, location, maxPages: 1, sources: (sources as any) ?? undefined } as any);
  }, [hasSearched, location, query, scrapeAll, sources]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(ellipse 70% 60% at 10% 10%, rgba(59,130,246,.25) 0%, transparent 62%), radial-gradient(ellipse 60% 55% at 90% 20%, rgba(255,255,255,.10) 0%, transparent 60%)' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-slate-200" />
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Your AI Career Command Center
            </h1>
            <p className="mt-4 text-slate-200/90 text-base sm:text-lg leading-relaxed max-w-2xl">
              Sebenza AI discovers opportunities, analyzes the South African market, and automates your applications with intelligent guardrails.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/jobs/all"
                className="inline-flex items-center justify-center rounded-xl bg-white text-[#050815] px-5 py-2.5 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-base font-semibold text-white">Unified Job Feed</div>
                <div className="text-xs text-slate-200/70">LinkedIn · Indeed · Pnet · Career24 · JobMail</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm bg-white text-[#050815] border-white">
                  <LayoutGrid className="w-4 h-4" />
                  List
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-slate-200/70">Tip: refine your filters for a tighter feed.</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/8 transition-colors"
                  >
                    Filters
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-4"
                  >
                    <EnhancedJobSearch
                      onSearch={(p) => void runSearch(p)}
                      isLoading={isScraping}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {!showFilters && (
                <div className="mt-4">
                  <EnhancedJobSearch onSearch={(p) => void runSearch(p)} isLoading={isScraping} />
                </div>
              )}

              <div className="mt-6">
                <div className="rounded-2xl border border-white/10 bg-black/10 overflow-hidden">
                  <JobSearchResults
                    initialQuery={query}
                    initialLocation={location}
                    onJobSelect={(job) => setSelectedJob(job as any)}
                    sharedJobs={sortedJobs as any}
                    sharedIsLoading={isLoading}
                    sharedScrapeAll={scrapeAll as any}
                    showSearchForm={false}
                  />
                </div>

                {error && (
                  <div className="mt-4 text-xs text-red-200 border border-red-500/20 bg-red-500/10 rounded-xl p-3">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <SouthAfricaMarketCard jobs={sortedJobs} query={query} location={location} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <CareerInsightsSidebar
            selectedJob={selectedJob}
            applicationsSent={applications.length}
            alertsActive={jobAlerts.filter((a) => a.isActive).length}
            savedJobs={savedJobs.length}
          />
        </div>
      </div>
    </div>
  );
}
