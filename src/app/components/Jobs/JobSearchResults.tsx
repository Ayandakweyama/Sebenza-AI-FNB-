import { useState, useEffect } from 'react';
import { Job, useJobScraper } from '@/hooks/useJobScraper';
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
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-input bg-transparent hover:bg-gray-100',
    ghost: 'hover:bg-gray-100',
    link: 'underline-offset-4 hover:underline text-blue-600 hover:text-blue-800',
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
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
  <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md ${className}`}>
    <div className="p-1">{children}</div>
  </div>
);

const SelectItem = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Custom Skeleton component
const Skeleton = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <div 
    className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    {...props}
  />
);

// Custom Card components since shadcn/ui Card is not installed
const Card = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <div 
    className={`rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}
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
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
);

const CardDescription = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <p 
    className={`text-sm text-gray-500 ${className}`}
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
  const baseStyles = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantStyles = {
    default: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700',
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
}

export function JobSearchResults({ 
  initialQuery = 'software engineer', 
  initialLocation = 'South Africa',
  onJobSelect 
}: JobSearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  
  const { 
    scrapeAll, 
    jobs, 
    isLoading, 
    error,
    getIsLoading,
    getError
  } = useJobScraper({
    onScrapeStart: () => console.log('Starting job search...'),
    onScrapeComplete: (jobs, source) => {
      console.log(`Found ${jobs.length} jobs from ${source}`);
    },
    onError: (error, source) => {
      console.error(`Error from ${source}:`, error);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && location.trim()) {
      scrapeAll({ query, location, maxPages: 2 });
    }
  };

  // Initial search on component mount
  useEffect(() => {
    if (initialQuery && initialLocation) {
      scrapeAll({ query: initialQuery, location: initialLocation, maxPages: 2 });
    }
  }, []);

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
                <label htmlFor="job-title" className="text-sm font-medium">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
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
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.map((job, index) => (
          <Card 
            key={`${job.source}-${index}`} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onJobSelect?.(job)}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{job.company}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.location && (
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                    )}
                    {job.salary && !job.salary.includes('not specified') && (
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salary}
                      </span>
                    )}
                    {job.postedDate && (
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
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
                  <Badge variant="outline" className="text-xs">
                    {job.source}
                  </Badge>
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              
              {job.description && (
                <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {job.description}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Load More Button */}
      {filteredJobs.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => {
              const currentSource = selectedSource === 'all' ? 'careerjunction' : selectedSource;
              // Implement pagination logic here if needed
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Jobs'}
          </Button>
        </div>
      )}
    </div>
  );
}
