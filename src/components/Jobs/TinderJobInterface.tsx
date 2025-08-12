'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { Job, useJobScraper } from '@/hooks/useJobScraper';
import { EnhancedTinderCard } from './EnhancedTinderCard';
import { JobDetailsModal } from './JobDetailsModal';

interface TinderJobInterfaceProps {
  initialQuery?: string;
  initialLocation?: string;
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
  initialLocation = 'South Africa' 
}: TinderJobInterfaceProps) {
  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Job state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);

  // Modal state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Job scraper hook
  const { 
    scrapeAll, 
    jobs, 
    isLoading, 
    getIsLoading,
    getError
  } = useJobScraper({
    onScrapeStart: () => console.log('🔍 Starting job search...'),
    onScrapeComplete: (jobs, source) => {
      console.log(`✅ Found ${jobs.length} jobs from ${source}`);
      setCurrentIndex(0); // Reset to first job when new results come in
    },
    onError: (error, source) => {
      console.error(`❌ Error from ${source}:`, error);
    },
  });

  // Get all jobs combined
  const allJobs = useMemo(() => {
    const combinedJobs: Job[] = [];
    Object.values(jobs).forEach(sourceJobs => {
      combinedJobs.push(...sourceJobs);
    });
    // Shuffle jobs for variety
    return combinedJobs.sort(() => Math.random() - 0.5);
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
    return filteredJobs.slice(currentIndex, currentIndex + 3);
  }, [filteredJobs, currentIndex]);

  // Current job
  const currentJob = visibleJobs[0];

  // Check if loading any source
  const isSearching = getIsLoading('indeed') || getIsLoading('careerjunction');

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && location.trim()) {
      scrapeAll({ query, location, maxPages: 3 });
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

  // Handle swipe right (apply)
  const handleSwipeRight = useCallback(() => {
    if (currentJob) {
      const action: SwipeAction = {
        type: 'apply',
        job: currentJob,
        timestamp: Date.now()
      };
      setSwipeHistory(prev => [...prev, action]);
      setAppliedJobs(prev => [...prev, currentJob]);
      setCurrentIndex(prev => prev + 1);
      
      // Optional: Open job URL
      if (currentJob.url) {
        window.open(currentJob.url, '_blank');
      }
    }
  }, [currentJob]);

  // Handle save job
  const handleSaveJob = useCallback((jobId: string) => {
    if (currentJob) {
      setSavedJobs(prev => {
        const exists = prev.some(job => (job.url || `${job.company}-${job.title}`) === jobId);
        if (exists) {
          return prev.filter(job => (job.url || `${job.company}-${job.title}`) !== jobId);
        } else {
          const action: SwipeAction = {
            type: 'save',
            job: currentJob,
            timestamp: Date.now()
          };
          setSwipeHistory(prevHistory => [...prevHistory, action]);
          return [...prev, currentJob];
        }
      });
    }
  }, [currentJob]);

  // Handle show job details
  const handleShowJobDetails = useCallback((job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  }, []);

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

  // Handle refresh jobs
  const handleRefresh = useCallback(() => {
    setCurrentIndex(0);
    setSwipeHistory([]);
    if (query.trim() && location.trim()) {
      scrapeAll({ query, location, maxPages: 3 });
    }
  }, [query, location, scrapeAll]);

  // Initial search
  useEffect(() => {
    handleRefresh();
  }, []);

  // Calculate progress
  const progress = filteredJobs.length > 0 ? (currentIndex / filteredJobs.length) * 100 : 0;
  const remaining = Math.max(0, filteredJobs.length - currentIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 flex gap-4 w-full lg:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {/* Filter button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>

              {/* Search button */}
              <motion.button
                type="submit"
                disabled={isSearching}
                className={`px-6 py-3 bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  isSearching ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
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
                className="overflow-hidden border-t border-gray-200 mt-4 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                    <select
                      value={filters.salary || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, salary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any</option>
                      <option value="R20,000">R20,000+</option>
                      <option value="R40,000">R40,000+</option>
                      <option value="R60,000">R60,000+</option>
                      <option value="R80,000">R80,000+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <select
                      value={filters.jobType || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Any</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Company name..."
                      value={filters.company || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="Industry..."
                      value={filters.industry || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats and controls */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{remaining}</span> jobs remaining
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Action stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{appliedJobs.length} applied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>{savedJobs.length} saved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>{swipeHistory.filter(a => a.type === 'skip').length} skipped</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <motion.button
                onClick={handleUndo}
                disabled={swipeHistory.length === 0 || currentIndex === 0}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={handleRefresh}
                disabled={isSearching}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md h-[600px] relative">
          {/* Loading state */}
          {isSearching && visibleJobs.length === 0 && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl shadow-lg border border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Finding great jobs...</h3>
              <p className="text-gray-600 text-center">
                Searching {query} positions in {location}
              </p>
            </motion.div>
          )}

          {/* No jobs state */}
          {!isSearching && filteredJobs.length === 0 && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl shadow-lg border border-gray-200 p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Search className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 text-center mb-6">
                Try adjusting your search terms or filters
              </p>
              <motion.button
                onClick={handleRefresh}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try again
              </motion.button>
            </motion.div>
          )}

          {/* All jobs viewed state */}
          {!isSearching && currentIndex >= filteredJobs.length && filteredJobs.length > 0 && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-3xl shadow-lg border border-gray-200 p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <TrendingUp className="w-16 h-16 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600 text-center mb-6">
                You've viewed all {filteredJobs.length} jobs. Search for more or adjust your filters.
              </p>
              <motion.button
                onClick={handleRefresh}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-5 h-5" />
                Search again
              </motion.button>
            </motion.div>
          )}

          {/* Job cards */}
          <AnimatePresence>
            {visibleJobs.map((job, index) => (
              <EnhancedTinderCard
                key={`${job.url || job.company}-${job.title}-${index}`}
                job={job}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
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
          if (job.url) {
            window.open(job.url, '_blank');
          }
          setShowJobDetails(false);
        }}
        onSave={(job) => {
          const jobId = job.url || `${job.company}-${job.title}`;
          handleSaveJob(jobId);
        }}
      />
    </div>
  );
}
