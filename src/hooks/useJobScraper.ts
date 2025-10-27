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
  source?: 'indeed' | 'pnet' | 'careerjunction' | 'linkedin';
}

interface ScraperOptions {
  query: string;
  location: string;
  maxPages?: number;
  sources?: ('indeed' | 'pnet' | 'careerjunction' | 'linkedin')[];
}

interface UseJobScraperProps {
  onScrapeStart?: () => void;
  onScrapeComplete?: (jobs: Job[], source: string) => void;
  onError?: (error: string, source?: string) => void;
}

export const useJobScraper = ({ onScrapeStart, onScrapeComplete, onError }: UseJobScraperProps = {}) => {
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeRequests, setActiveRequests] = useState<Set<string>>(new Set());

  const scrapeJobs = useCallback(async ({ 
    query, 
    location, 
    maxPages = 1,
    sources = ['indeed'] // Start with one source for faster response
  }: ScraperOptions) => {
    // Use enhanced multi-source scraper with LinkedIn support
    const endpoint = '/api/scrape-multi';  // Enhanced Puppeteer-based scraper with LinkedIn
    // const endpoint = '/api/scrape-fallback';  // Fallback Adzuna API (limited sources)
    
    // Create a unique request key to prevent duplicates
    const requestKey = `${query}-${location}-${sources.join(',')}-${maxPages}`;
    
    // Check if this exact request is already in progress
    if (activeRequests.has(requestKey)) {
      console.warn('🔄 Duplicate request detected, skipping...');
      return jobs; // Return current jobs if duplicate request
    }
    
    console.log(`🚀 Starting multi-source job scrape with query: "${query}", location: "${location}"`);
    console.log(`   Sources: ${sources.join(', ')}`);
    
    // Mark this request as active
    setActiveRequests(prev => new Set(prev).add(requestKey));
    
    sources.forEach(source => {
      setIsLoading(prev => ({ ...prev, [source]: true }));
      setErrors(prev => ({ ...prev, [source]: null }));
    });
    
    onScrapeStart?.();

    try {
      console.log(`🌐 Making request to multi-source scraper API`);
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Request timeout after 45 seconds, aborting...');
        controller.abort();
      }, 45000); // 45 second timeout - increased for slower scrapers
      
      const requestBody = { 
        query, 
        location, 
        maxPages,
        sources,
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
      
      console.log(`⏱️ Multi-source API response received in ${responseTime}ms with status: ${response.status}`);
      
      // Log performance metrics
      if (responseTime > 40000) {
        console.warn(`⚠️ Very slow response: ${responseTime}ms - scrapers may be overloaded`);
      } else if (responseTime > 20000) {
        console.warn(`⚠️ Slow response: ${responseTime}ms - consider using fewer sources`);
      } else if (responseTime < 5000) {
        console.log(`⚡ Fast response: ${responseTime}ms - likely from cache`);
      }

      let responseData;
      try {
        responseData = await response.json().catch(() => ({}));
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        responseData = {};
      }

      if (!response.ok) {
        console.error(`❌ Multi-source API error:`, {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          url: endpoint,
          method: 'POST'
        });
        
        let errorMessage = 'Error from job scraper: ';
        
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
        console.error(`❌ Multi-source API returned unsuccessful response:`, responseData);
        throw new Error(
          responseData.error || 
          responseData.message || 
          'Failed to fetch jobs from multiple sources'
        );
      }

      const allJobs = Array.isArray(responseData.jobs) ? responseData.jobs : [];
      
      console.log(`✅ Successfully fetched ${allJobs.length} jobs`);
      console.log(`   Jobs data:`, allJobs);
      console.log(`   Source breakdown:`, responseData.sourceCounts);
      
      // Store all jobs as a flat array
      setJobs(allJobs as any);
      console.log(`   Jobs state updated with ${allJobs.length} jobs`);
        
      onScrapeComplete?.(allJobs, sources.join(','));
      return allJobs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏰ Request timed out - attempting quick search fallback');
        
        // Try quick search as fallback
        try {
          const quickResponse = await fetch('/api/jobs/quick-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, location })
          });
          
          if (quickResponse.ok) {
            const quickData = await quickResponse.json();
            if (quickData.success && quickData.jobs) {
              console.log(`✅ Quick search returned ${quickData.jobs.length} jobs`);
              setJobs(quickData.jobs);
              onScrapeComplete?.(quickData.jobs, 'quick-search');
              return quickData.jobs;
            }
          }
        } catch (quickError) {
          console.error('Quick search also failed:', quickError);
        }
        
        // If quick search also fails, return empty
        setJobs([]);
        sources.forEach(source => {
          setErrors(prev => ({
            ...prev,
            [source]: 'Request timed out. Please try again.'
          }));
        });
        console.log('❌ All fallbacks failed, no jobs returned');
        onScrapeComplete?.([], sources.join(','));
        return [];
      }
      
      console.error(`❌ Error fetching jobs:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        sources,
        endpoint,
        query,
        location,
        maxPages
      });
      
      sources.forEach(source => {
        setErrors(prev => ({
          ...prev,
          [source]: errorMessage
        }));
      });
      
      onError?.(errorMessage);
    } finally {
      // Remove this request from active requests
      setActiveRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestKey);
        return newSet;
      });
      
      sources.forEach(source => {
        setIsLoading(prev => ({
          ...prev,
          [source]: false
        }));
      });
      
      console.log(`🏁 Finished multi-source job scrape`);
    }
  }, [onScrapeComplete, onError, onScrapeStart, activeRequests, jobs]);

  const scrapeAll = useCallback(async (options: Omit<ScraperOptions, 'sources'>) => {
    console.log('🚀 Starting multi-source job search');
    
    // Temporarily use simple scraper with mock data
    // TODO: Switch back to real scraper once browser issues are fixed
    // return scrapeJobs({
    //   ...options,
    //   sources: ['indeed', 'pnet', 'careerjunction']
    // });
    
    return scrapeJobs({
      ...options,
      sources: ['indeed', 'pnet']
    });
  }, [scrapeJobs]);

  // Get jobs from a specific source or all sources
  const getJobs = (source?: 'indeed' | 'pnet' | 'careerjunction') => {
    if (!Array.isArray(jobs)) return [];
    if (source) {
      return jobs.filter(job => job.source === source);
    }
    return jobs;
  };

  // Get loading state for a specific source or any source
  const getIsLoading = (source?: 'indeed' | 'pnet' | 'careerjunction') => {
    if (source) {
      return !!isLoading[source];
    }
    return Object.values(isLoading).some(loading => loading);
  };

  // Get error for a specific source or any source
  const getError = (source?: 'indeed' | 'pnet' | 'careerjunction') => {
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
    jobs: Array.isArray(jobs) ? jobs : [],
  };
};
