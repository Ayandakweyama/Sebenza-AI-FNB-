'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TinderJobInterface } from '@/components/Jobs/TinderJobInterface';
import { JobSearchResults } from '@/app/components/Jobs/JobSearchResults';
import { LayoutGrid, Heart } from 'lucide-react';
import { useJobScraper } from '@/hooks/useJobScraper';

type ViewMode = 'tinder' | 'list';

export default function AllJobsClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('tinder');
  const hasSearched = useRef(false);
  
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
      console.log('Jobs received:', jobs);
    },
    onError: (error) => {
      console.error(`❌ AllJobsClient - Error:`, error);
    },
  });

  const scrapeAllWithLinkedIn = (options: { query: string; location: string; maxPages?: number }) => {
    return scrapeAll({
      ...options,
      sources: ['indeed', 'jobmail', 'linkedin'],
    } as any);
  };
  
  // Log jobs state changes
  useEffect(() => {
    console.log('📊 AllJobsClient - Jobs state updated:', {
      count: jobs?.length || 0,
      isArray: Array.isArray(jobs),
      jobs: jobs
    });
  }, [jobs]);
  
  // Initial search on mount - only once
  useEffect(() => {
    if (!hasSearched.current) {
      console.log('🚀 AllJobsClient - Initial search');
      hasSearched.current = true;
      scrapeAllWithLinkedIn({ 
        query: 'software engineer', 
        location: 'South Africa', 
        maxPages: 1 // Start with 1 page for faster results
      });
    }
  }, [scrapeAllWithLinkedIn]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header with view toggle */}
      <div className="sticky top-0 z-10 rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 10% 10%, rgba(59,130,246,.25) 0%, transparent 62%), radial-gradient(ellipse 60% 55% at 90% 20%, rgba(255,255,255,.10) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-white drop-shadow-lg">
                Find Your Next Opportunity
              </h2>
              <p className="text-slate-200/80 text-sm sm:text-base md:text-lg font-medium">
                Discover jobs from Indeed, PNet, Careers24, LinkedIn & more
              </p>
            </div>

            {/* View mode toggle */}
            <div className="flex justify-center sm:justify-start">
              <div className="bg-black/20 border border-white/10 backdrop-blur-sm p-1 rounded-lg sm:rounded-xl flex gap-1 shadow-lg w-full sm:w-auto max-w-xs sm:max-w-none">
                <motion.button
                  onClick={() => setViewMode('tinder')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg md:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base ${
                    viewMode === 'tinder'
                      ? 'bg-white text-[#050815] shadow-lg shadow-white/20'
                      : 'text-slate-200/80 hover:text-white hover:bg-white/10'
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
                      ? 'bg-white text-[#050815] shadow-lg shadow-white/20'
                      : 'text-slate-200/80 hover:text-white hover:bg-white/10'
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
              sharedScrapeAll={scrapeAllWithLinkedIn}
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
              sharedScrapeAll={scrapeAllWithLinkedIn}
            />
          </div>
        )}
      </div>
    </div>
  );
}
