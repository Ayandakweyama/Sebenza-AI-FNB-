'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TinderJobInterface } from '@/components/Jobs/TinderJobInterface';
import { JobSearchResults } from '@/app/components/Jobs/JobSearchResults';
import { LayoutGrid, Heart, Search, Bot, ArrowRight, Briefcase, Sparkles, Zap } from 'lucide-react';
import { useJobScraper } from '@/hooks/useJobScraper';
import { useRouter } from 'next/navigation';

type ViewMode = 'landing' | 'tinder' | 'list';

export default function AllJobsClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const hasSearched = useRef(false);
  const router = useRouter();
  
  // Shared job scraper instance
  const { 
    scrapeAll, 
    jobs, 
    isLoading, 
    error
  } = useJobScraper({
    onScrapeStart: () => console.log('🔍 AllJobsClient - Starting job search...'),
    onScrapeComplete: (jobs, source) => {
      console.log(`✅ AllJobsClient - Found ${jobs.length} jobs from ${source}`);
    },
    onError: (error) => {
      console.error(`❌ AllJobsClient - Error:`, error);
    },
  });

  // Trigger search when entering job portal view
  useEffect(() => {
    if ((viewMode === 'tinder' || viewMode === 'list') && !hasSearched.current) {
      hasSearched.current = true;
      scrapeAll({ 
        query: 'software engineer', 
        location: 'South Africa', 
        maxPages: 1
      });
    }
  }, [viewMode, scrapeAll]);

  // ─── Landing View ─────────────────────────────────────────────────
  if (viewMode === 'landing') {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center pt-4 sm:pt-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3"
          >
            Find Your Next Opportunity
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4"
          >
            Browse jobs manually or let our AI agent apply for you automatically
          </motion.p>
        </div>

        {/* Cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Job Portal Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => setViewMode('tinder')}
            className="group cursor-pointer bg-gradient-to-br from-pink-600/20 via-slate-800/80 to-purple-600/20 border border-pink-500/30 hover:border-pink-400/60 rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-lg hover:shadow-pink-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Search className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-pink-300 transition-colors">
                  Job Portal
                </h2>
                <p className="text-xs sm:text-sm text-pink-300/70">Browse & swipe</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm sm:text-base mb-6 leading-relaxed">
              Search and discover jobs from Indeed, Pnet, Career24, LinkedIn & more. Swipe through listings or browse in list view.
            </p>

            <div className="space-y-2.5 mb-6">
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <Heart className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span>Tinder-style swipe interface</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <LayoutGrid className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>List view with filters</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <Briefcase className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Multiple job boards in one place</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-pink-400 group-hover:text-pink-300 font-semibold text-sm sm:text-base transition-colors">
              <span>Browse Jobs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Auto Apply AI Agent Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => router.push('/jobs/auto-apply')}
            className="group cursor-pointer bg-gradient-to-br from-purple-600/20 via-slate-800/80 to-blue-600/20 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 relative overflow-hidden"
          >
            {/* AI Badge */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              AI Powered
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  Auto Apply AI
                </h2>
                <p className="text-xs sm:text-sm text-purple-300/70">Hands-free applications</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm sm:text-base mb-6 leading-relaxed">
              Let our AI agent search, evaluate, and apply to jobs for you automatically. It matches your profile and fills out applications using your CV.
            </p>

            <div className="space-y-2.5 mb-6">
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>AI evaluates job match score</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span>Auto-fills application forms</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-300">
                <Bot className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Watch the agent work in real-time</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 font-semibold text-sm sm:text-base transition-colors">
              <span>Start Auto Apply</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Job Portal View ──────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header with view toggle */}
      <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 shadow-2xl border border-pink-500/30 sticky top-0 z-10 rounded-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center justify-between">
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-white drop-shadow-lg">
                  Job Portal
                </h2>
                <p className="text-pink-200 text-sm sm:text-base md:text-lg font-medium">
                  Discover jobs from Indeed, Pnet, Career24, LinkedIn & more
                </p>
              </div>
              <button
                onClick={() => { setViewMode('landing'); hasSearched.current = false; }}
                className="text-white/70 hover:text-white text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Back
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex justify-center sm:justify-start">
              <div className="bg-white/10 backdrop-blur-sm p-1 rounded-lg sm:rounded-xl flex gap-1 shadow-lg w-full sm:w-auto max-w-xs sm:max-w-none">
                <motion.button
                  onClick={() => setViewMode('tinder')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg md:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
                    viewMode === 'tinder'
                      ? 'bg-white text-pink-700 shadow-lg shadow-white/30'
                      : 'text-white/80 hover:text-white hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="hidden xs:inline sm:inline">Swipe</span>
                </motion.button>

                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg md:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
                    viewMode === 'list'
                      ? 'bg-white text-pink-700 shadow-lg shadow-white/30'
                      : 'text-white/80 hover:text-white hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="hidden xs:inline sm:inline">List</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="flex-1">
        {viewMode === 'tinder' ? (
          <div className="px-2 sm:px-4">
            <TinderJobInterface
              initialQuery="software engineer"
              initialLocation="South Africa"
              sharedJobs={jobs}
              sharedIsLoading={isLoading}
              sharedScrapeAll={scrapeAll}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <JobSearchResults
              initialQuery="software engineer"
              initialLocation="South Africa"
              onJobSelect={(job) => console.log('Selected job:', job)}
              sharedJobs={jobs}
              sharedIsLoading={isLoading}
              sharedScrapeAll={scrapeAll}
            />
          </div>
        )}
      </div>
    </div>
  );
}
