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
      scrapeAll({ 
        query: 'software engineer', 
        location: 'South Africa', 
        maxPages: 1 // Start with 1 page for faster results
      });
    }
  }, [scrapeAll]);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header with view toggle */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 shadow-2xl border-b border-purple-500/30 sticky top-0 sm:top-16 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col gap-6">
            <div className="text-white text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-white drop-shadow-lg">
                Find Your Next Opportunity
              </h1>
              <p className="text-purple-100 text-sm sm:text-base md:text-lg font-medium">
                Discover jobs from Indeed, Pnet & CareerJunction
              </p>
            </div>

            {/* View mode toggle */}
            <div className="flex justify-center sm:justify-start">
              <div className="bg-white/10 backdrop-blur-sm p-1 rounded-xl sm:rounded-2xl flex gap-1 shadow-lg w-full sm:w-auto">
                <motion.button
                  onClick={() => setViewMode('tinder')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                    viewMode === 'tinder'
                      ? 'bg-white text-purple-700 shadow-lg shadow-white/30'
                      : 'text-white/80 hover:text-white hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Swipe</span>
                </motion.button>
                
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                    viewMode === 'list'
                      ? 'bg-white text-purple-700 shadow-lg shadow-white/30'
                      : 'text-white/80 hover:text-white hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">List</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="flex-1">
        {viewMode === 'tinder' ? (
          <TinderJobInterface 
            initialQuery="software engineer"
            initialLocation="South Africa"
            sharedJobs={jobs}
            sharedIsLoading={isLoading}
            sharedScrapeAll={scrapeAll}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
