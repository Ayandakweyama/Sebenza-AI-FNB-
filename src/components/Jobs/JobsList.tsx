'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { RefreshCw, Heart, Bookmark } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

// Dynamically import TinderCard with SSR disabled
const TinderCard = dynamic(
  () => import('./TinderCard').then((mod) => mod.TinderCard),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Loading job card...</div>
      </div>
    )
  }
);

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  skills?: string[];
}

interface JobsListProps {
  onSave: (jobId: string) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
  onResetFilters: () => void;
  onResetJobs: () => void;
}

// Memoize the JobsList component to prevent unnecessary re-renders
const JobsListComponent = memo(function JobsList({
  onSave,
  onSwipeLeft,
  onSwipeRight,
  onSearch,
  onFilterChange,
  onResetFilters,
  onResetJobs
}: JobsListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    salaryRange: '',
    jobType: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching jobs from API...');
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Add any search parameters here if needed
          }),
        });

        const responseText = await response.text();
        let data;
        
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
          console.error('Failed to parse JSON response:', responseText);
          throw new Error('Invalid response from server');
        }

        if (!response.ok) {
          console.error('API Error:', data || response.statusText);
          throw new Error(
            data?.error || 
            data?.message || 
            `Failed to fetch jobs: ${response.status} ${response.statusText}`
          );
        }

        if (!data || !Array.isArray(data)) {
          console.error('Invalid data format received:', data);
          throw new Error('Invalid data format received from server');
        }

        console.log('Jobs fetched successfully. Count:', data.length);
        setJobs(data);
      } catch (err) {
        console.error('Error in fetchJobs:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to load jobs. Please try again later.'
        );
        setJobs([]); // Clear jobs on error
      } finally {
        setLoading(false);
      }  
    };

    fetchJobs();
  }, []);

  // Handle local save action
  const handleSave = useCallback((jobId: string) => {
    console.log('Saving job:', jobId);
    onSave(jobId);
  }, [onSave]);

  // Handle local swipe actions
  const handleLocalSwipeLeft = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, jobs.length - 1));
    onSwipeLeft();
  }, [jobs.length, onSwipeLeft]);

  const handleLocalSwipeRight = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, jobs.length - 1));
    onSwipeRight();
  }, [jobs.length, onSwipeRight]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No jobs found. Try adjusting your search criteria.</p>
        <button 
          onClick={onResetFilters}
          className="mt-4 inline-flex items-center justify-center rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  // Render the jobs list based on view mode
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-slate-800/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-slate-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                  <span className="text-purple-300 text-sm font-medium">{job.salary}</span>
                </div>
                
                <div className="flex items-center text-sm text-slate-300 mb-3">
                  <span>{job.company} • {job.location}</span>
                </div>
                
                <p className="text-slate-300 text-sm mb-4 line-clamp-2">{job.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills?.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-row sm:flex-row justify-end items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-slate-600/50 hover:bg-slate-700/50 hover:border-purple-500/50 text-slate-300 hover:text-white"
                    onClick={() => handleSave(job.id)}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default card view
  return (
    <div className="relative w-full max-w-md mx-auto h-[600px]">
      {jobs.length > 0 && currentIndex < jobs.length ? (
        <TinderCard
          key={jobs[currentIndex].id}
          job={jobs[currentIndex]}
          onSwipeLeft={handleLocalSwipeLeft}
          onSwipeRight={handleLocalSwipeRight}
          onSave={() => handleSave(jobs[currentIndex].id)}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-xl font-semibold text-white mb-2">No more jobs</p>
          <p className="text-gray-400">You've seen all available jobs.</p>
          <Button 
            onClick={onResetJobs}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Jobs
          </Button>
        </div>
      )}
      
      {currentIndex < jobs.length && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Swipe {currentIndex < jobs.length - 1 ? 'left to skip, right to apply' : 'to see more options'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {currentIndex + 1} of {jobs.length} jobs
          </p>
        </div>
      )}
    </div>
  );
});

// Export the component as a named export
export const JobsList = JobsListComponent;
