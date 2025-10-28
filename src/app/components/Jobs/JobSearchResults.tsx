import { useState, useEffect, useRef } from 'react';
import { Job, useJobScraper } from '@/hooks/useJobScraper';
import { useJobContext } from '@/contexts/JobContext';
// Custom Button component
const Button = ({ 
  variant = 'default', 
  size = 'default',
  className = '', 
  children, 
  ...props 
}: { 
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string; 
  children: React.ReactNode;
  [key: string]: any;
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles = {
    default: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/30',
    outline: 'border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:border-purple-500/30',
    ghost: 'hover:bg-slate-700/50 text-slate-300',
    link: 'underline-offset-4 hover:underline text-purple-400 hover:text-purple-300',
  };
  
  const sizeStyles = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Input component
const Input = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-slate-600 bg-slate-700/50 text-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
    {...props}
  />
);

// Custom Select components
const Select = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
  <div className="relative" {...props}>
    {children}
  </div>
);

const SelectTrigger = ({ className = '', children, ...props }: { className?: string; children: React.ReactNode; [key: string]: any }) => (
  <div
    className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-600 bg-slate-700/50 text-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
    {...props}
  >
    {children}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 opacity-50"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </div>
);

const SelectValue = ({ children }: { children: React.ReactNode }) => (
  <span className="flex-1 text-left">{children}</span>
);

const SelectContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-600 bg-slate-800 text-white shadow-xl ${className}`}>
    <div className="p-1">{children}</div>
  </div>
);

const SelectItem = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-700 focus:text-white hover:bg-slate-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Custom Skeleton component
const Skeleton = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <div 
    className={`animate-pulse rounded-md bg-slate-700/50 ${className}`}
    {...props}
  />
);

// Custom Card components since shadcn/ui Card is not installed
const Card = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <div 
    className={`rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-xl transition-all hover:shadow-2xl hover:border-purple-500/30 ${className}`}
    {...props}
  />
);

const CardHeader = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <div 
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    {...props}
  />
);

const CardTitle = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <h3 
    className={`text-2xl font-semibold leading-none tracking-tight text-white ${className}`}
    {...props}
  />
);

const CardDescription = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <p 
    className={`text-sm text-slate-400 ${className}`}
    {...props}
  />
);

const CardContent = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <div 
    className={`p-6 pt-0 ${className}`}
    {...props}
  />
);
// Custom Badge component since shadcn/ui Badge is not installed
const Badge = ({ variant = 'outline', className = '', children, ...props }: { variant?: 'default' | 'outline'; className?: string; children: React.ReactNode; [key: string]: any }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantStyles = {
    default: 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30',
    outline: 'border border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-slate-300',
  };
  
  return (
    <span 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
import { Search, MapPin, Briefcase, DollarSign, Calendar, ExternalLink } from 'lucide-react';

interface JobSearchResultsProps {
  initialQuery?: string;
  initialLocation?: string;
  onJobSelect?: (job: Job) => void;
  sharedJobs?: Job[];
  sharedIsLoading?: boolean;
  sharedScrapeAll?: (options: { query: string; location: string; maxPages?: number }) => Promise<any>;
}

export function JobSearchResults({ 
  initialQuery = 'software engineer', 
  initialLocation = 'South Africa',
  onJobSelect,
  sharedJobs,
  sharedIsLoading,
  sharedScrapeAll
}: JobSearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  
  const localScraper = useJobScraper({
    onScrapeStart: () => console.log('Starting job search...'),
    onScrapeComplete: (jobs, source) => {
      console.log(`Found ${jobs.length} jobs from ${source}`);
    },
    onError: (error) => {
      console.error(`Error:`, error);
    },
  });
  
  const scrapeAll = sharedScrapeAll || localScraper.scrapeAll;
  const jobs = sharedJobs !== undefined ? sharedJobs : localScraper.jobs;
  const isLoading = sharedIsLoading !== undefined ? sharedIsLoading : localScraper.isLoading;
  const error = localScraper.error;

  // Job context for saving functionality
  const { saveJob, unsaveJob, isSaved } = useJobContext();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && location.trim()) {
      scrapeAll({ query, location, maxPages: 2 });
    }
  };

  const handleSave = async (jobId: string) => {
    const job = filteredJobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      if (isSaved(jobId)) {
        await unsaveJob(jobId);
      } else {
        await saveJob(job);
      }
    } catch (error) {
      console.error('Failed to save/unsave job:', error);
    }
  };

  // Only run initial search if we're using local scraper (not shared)
  const hasSearched = useRef(false);
  useEffect(() => {
    if (!sharedScrapeAll && !hasSearched.current && initialQuery && initialLocation) {
      hasSearched.current = true;
      scrapeAll({ query: initialQuery, location: initialLocation, maxPages: 2 });
    }
  }, [sharedScrapeAll, initialQuery, initialLocation, scrapeAll]);

  // Use all jobs since we're not filtering by source anymore
  const filteredJobs = jobs;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="job-title" className="text-sm font-medium text-slate-300">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="job-title"
                    placeholder="e.g. Software Engineer"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-slate-300">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="location"
                    placeholder="e.g. Cape Town"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  className="w-full h-10"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      Find Jobs
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredJobs.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No jobs found</h3>
          <p className="text-slate-400">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.map((job, index) => (
          <Card 
            key={`${job.source}-${index}`} 
            className="group cursor-pointer"
            onClick={() => onJobSelect?.(job)}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-purple-200 mt-1">{job.company}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-3">
                    {job.location && (
                      <span className="inline-flex items-center text-sm text-slate-300">
                        <MapPin className="h-4 w-4 mr-1 text-purple-400" />
                        {job.location}
                      </span>
                    )}
                    {job.salary && !job.salary.includes('not specified') && (
                      <span className="inline-flex items-center text-sm text-slate-300">
                        <DollarSign className="h-4 w-4 mr-1 text-green-400" />
                        {job.salary}
                      </span>
                    )}
                    {job.postedDate && (
                      <span className="inline-flex items-center text-sm text-slate-300">
                        <Calendar className="h-4 w-4 mr-1 text-blue-400" />
                        {job.postedDate}
                      </span>
                    )}
                  </div>
                  
                  {job.jobType && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {job.jobType}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs capitalize">
                    {job.source}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(job.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isSaved(job.id)
                        ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
                        : 'text-slate-400 hover:text-yellow-400 hover:bg-slate-700/50'
                    }`}
                    aria-label={isSaved(job.id) ? 'Unsave job' : 'Save job'}
                  >
                    <svg
                      className={`h-5 w-5 ${isSaved(job.id) ? 'fill-current' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-lg hover:bg-purple-500/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              {job.description && (
                <div className="mt-3 text-sm text-slate-300 line-clamp-2">
                  {job.description}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Results Summary */}
      {filteredJobs.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="text-center text-slate-400">
            <p className="text-sm">
              Showing <span className="font-semibold text-white">{filteredJobs.length}</span> job{filteredJobs.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs mt-1">Search for more jobs using the form above</p>
          </div>
        </div>
      )}
    </div>
  );
}
