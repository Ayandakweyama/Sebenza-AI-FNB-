import { useState, useCallback } from 'react';

export interface Job {
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  postedDate?: string;
  description?: string;
  jobType?: string;
  industry?: string;
  reference?: string;
  source?: 'careerjunction'; // Only using CareerJunction as the job source
}

interface ScraperOptions {
  query: string;
  location: string;
  maxPages?: number;
  source?: 'careerjunction'; // Only using CareerJunction as the job source
}

interface UseJobScraperProps {
  onScrapeStart?: () => void;
  onScrapeComplete?: (jobs: Job[], source: string) => void;
  onError?: (error: string, source?: string) => void;
}

export const useJobScraper = ({ onScrapeStart, onScrapeComplete, onError }: UseJobScraperProps = {}) => {
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [jobs, setJobs] = useState<{ [key: string]: Job[] }>({});

  const scrapeJobs = useCallback(async ({ 
    query, 
    location, 
    maxPages = 1,
    // Only using CareerJunction as the job source
    source = 'careerjunction' as const // Force type to only allow 'careerjunction'
  }: ScraperOptions) => {
    // Only use CareerJunction endpoint
    const endpoint = '/api/scrape-careerjunction';
    
    console.log(`🚀 Starting CareerJunction job scrape with query: "${query}", location: "${location}"`);
    setIsLoading(prev => ({ ...prev, [source]: true }));
    setErrors(prev => ({ ...prev, [source]: null }));
    onScrapeStart?.();

    try {
      console.log(`🌐 Making request to CareerJunction API`);
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
      
      const requestBody = { 
        query, 
        location, 
        maxPages,
        timestamp: new Date().toISOString()
      };
      
      console.log('Request payload:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-Source': 'useJobScraper',
          'X-Source-Page': typeof window !== 'undefined' ? window.location.pathname : ''
        },
        body: JSON.stringify(requestBody)
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      console.log(`⏱️ ${source} API response received in ${responseTime}ms with status: ${response.status}`);

      let responseData;
      try {
        responseData = await response.json().catch(() => ({}));
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        responseData = {};
      }

      if (!response.ok) {
        console.error(`❌ ${source} API error:`, {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          url: endpoint,
          method: 'POST'
        });
        
        let errorMessage = `Error from ${source}: `;
        
        if (response.status === 500) {
          errorMessage += 'Internal server error. Please try again later.';
        } else if (response.status === 429) {
          errorMessage += 'Too many requests. Please wait before trying again.';
        } else if (responseData?.error) {
          errorMessage += responseData.error;
        } else if (responseData?.message) {
          errorMessage += responseData.message;
        } else {
          errorMessage += `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (!responseData.success) {
        console.error(`❌ ${source} API returned unsuccessful response:`, responseData);
        throw new Error(
          responseData.error || 
          responseData.message || 
          `Failed to fetch jobs from ${source}`
        );
      }

      const sourceJobs = (responseData.jobs || []).map((job: Job) => ({
        ...job,
        source: source as 'indeed' | 'careerjunction',
      }));
      
      console.log(`✅ Successfully fetched ${sourceJobs.length} jobs from ${source}`);
      
      setJobs(prev => ({
        ...prev,
        [source]: sourceJobs,
      }));
        
        onScrapeComplete?.(sourceJobs, source);
        return sourceJobs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`❌ Error fetching jobs from ${source}:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        source,
        endpoint,
        query,
        location,
        maxPages
      });
      
      setErrors(prev => ({
        ...prev,
        [source]: errorMessage
      }));
      
      onError?.(errorMessage, source);
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [source]: false
      }));
      
      console.log(`🏁 Finished ${source} job scrape`);
    }
  }, [onScrapeComplete, onError, onScrapeStart]);

  // Function to scrape from CareerJunction with enhanced error handling and fallbacks
  const scrapeAll = useCallback(async (options: Omit<ScraperOptions, 'source'>) => {
    console.log('🚀 Starting job search from CareerJunction');
    
    // Only use CareerJunction as the source
    const sources: ('careerjunction')[] = ['careerjunction'];
    
    // Start the scraper with fallback
    const promises = [
      ...sources.map(source => 
        scrapeJobs({ ...options, source }).catch(error => {
          console.error(`Failed to scrape ${source}:`, error);
          return [];
        })
      ),
      // Add Jooble API fallback for immediate results
      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: options.query, 
          location: options.location, 
          maxPages: options.maxPages 
        })
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const fallbackJobs = Array.isArray(data) ? data : (data.jobs || []);
          console.log(`✅ Jooble API: ${fallbackJobs.length} jobs found`);
          return fallbackJobs.map((job: any) => ({
            ...job,
            source: 'jooble'
          }));
        }
        throw new Error('Jooble API failed');
      }).catch((error) => {
        console.log(`❌ Jooble API failed:`, error);
        return [];
      })
    ];
    
    const results = await Promise.all(promises);
    const allJobs = results.flat();
    
    // Deduplicate jobs based on URL or title+company combination
    const uniqueJobs = allJobs.filter((job, index, self) => {
      const identifier = job.url || `${job.title}-${job.company}-${job.location}`;
      return self.findIndex(j => (j.url || `${j.title}-${j.company}-${j.location}`) === identifier) === index;
    });
    
    console.log(`🎉 Total unique jobs found: ${uniqueJobs.length} (${allJobs.length - uniqueJobs.length} duplicates removed)`);
    return uniqueJobs;
  }, [scrapeJobs]);

  // Get jobs from a specific source or all sources
  const getJobs = (source?: 'indeed' | 'careerjunction') => {
    if (source) {
      return jobs[source] || [];
    }
    return Object.values(jobs).flat();
  };

  // Get loading state for a specific source or any source
  const getIsLoading = (source?: 'indeed' | 'careerjunction') => {
    if (source) {
      return !!isLoading[source];
    }
    return Object.values(isLoading).some(loading => loading);
  };

  // Get error for a specific source or any source
  const getError = (source?: 'indeed' | 'careerjunction') => {
    if (source) {
      return errors[source] || null;
    }
    const errorMessages = Object.values(errors).filter(Boolean);
    return errorMessages.length > 0 ? errorMessages.join('\n') : null;
  };

  return {
    scrapeJobs,
    scrapeAll,
    getJobs,
    isLoading: getIsLoading(),
    getIsLoading,
    error: getError(),
    getError,
    jobs: getJobs(),
    jobsBySource: jobs,
  };
};
