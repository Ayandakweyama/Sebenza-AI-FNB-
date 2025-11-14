'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import '@/styles/mobile-tinder.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Filter, 
  RefreshCw, 
  Heart, 
  X, 
  Bookmark,
  Settings,
  RotateCcw,
  TrendingUp,
  Zap,
  Sparkles,
  Lock
} from 'lucide-react';
import { Job, useJobScraper } from '@/hooks/useJobScraper';
import { EnhancedTinderCard } from './EnhancedTinderCard';
import { JobDetailsModal } from './JobDetailsModal';
import { useJobContext } from '@/contexts/JobContext';

interface TinderJobInterfaceProps {
  initialQuery?: string;
  initialLocation?: string;
  sharedJobs?: Job[];
  sharedIsLoading?: boolean;
  sharedScrapeAll?: (options: { query: string; location: string; maxPages?: number }) => Promise<any>;
}

interface SwipeAction {
  type: 'skip' | 'apply' | 'save';
  job: Job;
  timestamp: number;
}

interface SearchFilters {
  salary?: string;
  jobType?: string;
  company?: string;
  industry?: string;
}

export function TinderJobInterface({ 
  initialQuery = 'software engineer', 
  initialLocation = 'South Africa',
  sharedJobs,
  sharedIsLoading,
  sharedScrapeAll
}: TinderJobInterfaceProps) {
  const { saveJob, applyToJob, isSaved, hasApplied } = useJobContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const hasInitialSearchRun = useRef(false);

  // Job state
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);

  // Job scraper hook - use shared if available, otherwise use own instance
  const localScraper = useJobScraper({
    onScrapeStart: () => console.log('🔍 Starting job search...'),
    onScrapeComplete: (jobs, source) => {
      console.log(`✅ Found ${jobs.length} jobs from ${source}`);
      setCurrentIndex(0); // Reset to first job when new results come in
    },
    onError: (error) => {
      console.error(`❌ Error:`, error);
    },
  });
  
  const scrapeAll = sharedScrapeAll || localScraper.scrapeAll;
  const jobs = sharedJobs !== undefined ? sharedJobs : localScraper.jobs;
  const isLoading = sharedIsLoading !== undefined ? sharedIsLoading : localScraper.isLoading;

  // Get all jobs combined
  const allJobs = useMemo(() => {
    console.log('🔍 TinderJobInterface - Processing jobs:', { 
      jobs, 
      isArray: Array.isArray(jobs), 
      type: typeof jobs,
      length: Array.isArray(jobs) ? jobs.length : 'N/A'
    });
    if (!jobs || !Array.isArray(jobs)) {
      console.log('⚠️ TinderJobInterface - No jobs or jobs is not an array');
      return [];
    }
    console.log('✅ TinderJobInterface - Jobs received:', jobs.length, 'First job:', jobs[0]);
    // Don't shuffle to maintain consistency
    return [...jobs];
  }, [jobs]);

  // Filter jobs based on current filters
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      if (filters.salary && !job.salary.toLowerCase().includes(filters.salary.toLowerCase())) {
        return false;
      }
      if (filters.jobType && !job.jobType?.toLowerCase().includes(filters.jobType.toLowerCase())) {
        return false;
      }
      if (filters.company && !job.company.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }
      if (filters.industry && !job.industry?.toLowerCase().includes(filters.industry.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [allJobs, filters]);

  // Get visible jobs (current + next few for smooth animations)
  const visibleJobs = useMemo(() => {
    const visible = filteredJobs.slice(currentIndex, currentIndex + 3);
    console.log(`📊 TinderJobInterface - Visible jobs: ${visible.length}, Current index: ${currentIndex}, Total filtered: ${filteredJobs.length}`);
    return visible;
  }, [filteredJobs, currentIndex]);

  // Current job
  const currentJob = visibleJobs[0];

  // Check if loading any source
  const isSearching = isLoading;

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && location.trim()) {
      scrapeAll({ query, location, maxPages: 2 }); // 2 pages for more results
    }
  }, [query, location, scrapeAll]);

  // Handle swipe left (skip)
  const handleSwipeLeft = useCallback(() => {
    if (currentJob) {
      const action: SwipeAction = {
        type: 'skip',
        job: currentJob,
        timestamp: Date.now()
      };
      setSwipeHistory(prev => [...prev, action]);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentJob]);

  // Handle swipe right (apply) - DISABLED for AI Agent feature
  const handleSwipeRight = useCallback(() => {
    // AI Agent feature coming soon - just skip to next job for now
    if (currentJob) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentJob]);

  // Handle save job
  const handleSaveJob = useCallback(async (jobId: string) => {
    const job = jobs.find(j => (j.url || `${j.company}-${j.title}`) === jobId);
    if (job) {
      try {
        await saveJob(job);
        console.log('💾 Job saved successfully:', job.title);
      } catch (error) {
        console.error('Failed to save job:', error);
      }
    }
  }, [jobs, saveJob]);

  // Handle apply to job
  const handleApplyJob = useCallback(async (job: Job) => {
    try {
      await applyToJob(job);
      console.log('📝 Applied to job successfully:', job.title);
    } catch (error) {
      console.error('Failed to apply to job:', error);
    }
  }, [applyToJob]);

  // Handle undo last action
  const handleUndo = useCallback(() => {
    if (swipeHistory.length > 0 && currentIndex > 0) {
      const lastAction = swipeHistory[swipeHistory.length - 1];
      setSwipeHistory(prev => prev.slice(0, -1));
      setCurrentIndex(prev => prev - 1);
      
      // Remove from applied/saved lists if needed
      if (lastAction.type === 'apply') {
        setAppliedJobs(prev => prev.filter(job => job !== lastAction.job));
      } else if (lastAction.type === 'save') {
        setSavedJobs(prev => prev.filter(job => job !== lastAction.job));
      }
    }
  }, [swipeHistory, currentIndex]);

  // Handle show job details
  const handleShowJobDetails = useCallback((job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  }, []);

  // Handle refresh jobs
  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setSwipeHistory([]);
    if (query.trim() && location.trim()) {
      scrapeAll({ query, location, maxPages: 2 }); // 2 pages for more results
    }
  }, [query, location, scrapeAll]);

  // Only run initial search if we're using local scraper (not shared)
  const hasSearched = useRef(false);
  useEffect(() => {
    if (!sharedScrapeAll && !hasSearched.current) {
      console.log('🔄 TinderJobInterface - Initial mount, triggering search...');
      hasSearched.current = true;
      handleRefresh();
    }
  }, [sharedScrapeAll, handleRefresh]);

  // Calculate progress
  const progress = filteredJobs.length > 0 ? (currentIndex / filteredJobs.length) * 100 : 0;
  const remaining = Math.max(0, filteredJobs.length - currentIndex);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl shadow-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-center w-full">
            <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Filter button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all flex items-center gap-2 text-sm sm:text-base ${
                  showFilters 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30'
                }`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* Search button */}
              <motion.button
                type="submit"
                disabled={isSearching}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 ${
                  isSearching ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-blue-500/40 hover:scale-105'
                }`}
                whileHover={{ scale: isSearching ? 1 : 1.02 }}
                whileTap={{ scale: isSearching ? 1 : 0.98 }}
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-slate-700/50 mt-4 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Salary</label>
                    <select
                      value={filters.salary || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, salary: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <option value="">Any</option>
                      <option value="R20,000">R20,000+</option>
                      <option value="R40,000">R40,000+</option>
                      <option value="R60,000">R60,000+</option>
                      <option value="R80,000">R80,000+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Job Type</label>
                    <select
                      value={filters.jobType || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <option value="">Any</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Company name..."
                      value={filters.company || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Industry..."
                      value={filters.industry || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats and controls */}
      <div className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Progress */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-slate-300">
                <span className="font-semibold text-white">{remaining}</span> jobs remaining
              </div>
              <div className="flex-1 sm:flex-none sm:w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Action stats */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-slate-300 w-full sm:w-auto justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                <span className="whitespace-nowrap">{appliedJobs.length} applied</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>
                <span className="whitespace-nowrap">{savedJobs.length} saved</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
                <span className="whitespace-nowrap">{swipeHistory.filter(a => a.type === 'skip').length} skipped</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center sm:justify-end">
              <motion.button
                onClick={handleUndo}
                disabled={swipeHistory.length === 0 || currentIndex === 0}
                className="p-2 text-slate-400 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-slate-700/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              <motion.button
                onClick={handleRefresh}
                disabled={isSearching}
                className="p-2 text-slate-400 hover:text-purple-400 disabled:opacity-50 transition-colors rounded-lg hover:bg-slate-700/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isSearching ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:px-6 sm:py-8 md:px-8 md:py-10 overflow-hidden">
        <div className="w-full max-w-[340px] sm:max-w-[440px] md:max-w-[500px] lg:max-w-[540px] h-[calc(100vh-280px)] sm:h-[620px] md:h-[650px] relative touch-none tinder-container tinder-stack">
          
          {/* Loading state */}
          {isSearching && visibleJobs.length === 0 && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-purple-500/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <div className="absolute inset-0 w-12 h-12 bg-purple-500/20 rounded-full animate-ping"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Finding great jobs...</h3>
              <p className="text-slate-400 text-center">
                Searching {query} positions in {location}
              </p>
            </motion.div>
          )}

          {/* No jobs state */}
          {!isSearching && filteredJobs.length === 0 && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Search className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
              <p className="text-slate-400 text-center mb-6">
                Try adjusting your search terms or filters
              </p>
              <motion.button
                onClick={handleRefresh}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try again
              </motion.button>
            </motion.div>
          )}

          {/* All jobs viewed state */}
          {!isSearching && currentIndex >= filteredJobs.length && filteredJobs.length > 0 && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-green-500/30 p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <TrendingUp className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
              <p className="text-slate-400 text-center mb-6">
                You've viewed all {filteredJobs.length} jobs. Search for more or adjust your filters.
              </p>
              <motion.button
                onClick={handleRefresh}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-5 h-5" />
                Search again
              </motion.button>
            </motion.div>
          )}

          {/* Job cards */}
          <AnimatePresence>
            {visibleJobs.length > 0 && visibleJobs.map((job, index) => (
              <EnhancedTinderCard
                key={`${job.url || job.company}-${job.title}-${index}`}
                job={job}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={() => handleSwipeRight()}
                onSave={handleSaveJob}
                onShowDetails={handleShowJobDetails}
                active={index === 0}
                zIndex={visibleJobs.length - index}
                className={`transform scale-${95 + index * 2}`}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Job details modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={() => setShowJobDetails(false)}
        onApply={(job) => {
          // AI Agent feature coming soon - disabled for now
          // handleSwipeRight();
        }}
        onSave={(job) => {
          // Save job and advance to next card
          const jobId = job.url || `${job.company}-${job.title}`;
          handleSaveJob(jobId);
          handleSwipeLeft(); // Advance to next card (skip current one)
          setShowJobDetails(false);
        }}
        onSkip={(job) => {
          // Skip job and advance to next card
          handleSwipeLeft();
          setShowJobDetails(false);
        }}
      />
    </div>
  );
}
