import { useState, useCallback } from 'react';

export interface Job {
  id: string;
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
  source: 'indeed' | 'pnet' | 'careerjunction' | 'career24' | 'linkedin' | 'jobmail';
}

interface ScraperOptions {
  query: string;
  location: string;
  maxPages?: number;
  sources?: ('indeed' | 'pnet' | 'careerjunction' | 'career24' | 'linkedin' | 'jobmail')[];
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
    maxPages = 2,
    sources = ['indeed', 'jobmail'] // Default to most reliable sources
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
        console.warn('⏰ Request taking longer than expected (75s) - this is normal when scraping multiple sources');
        controller.abort();
      }, 75000); // 75 second timeout - increased for 4 sources instead of 2
      
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
      if (responseTime > 60000) {
        console.warn(`⚠️ Very slow response: ${responseTime}ms - normal for 4 sources`);
      } else if (responseTime > 30000) {
        console.warn(`⚠️ Slow response: ${responseTime}ms - scraping 4 job sites takes time`);
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
        console.log('⏰ Full scraping taking longer than expected');
        console.log('💡 Real scraping is still running in background');
        
        // Don't provide fallback data - wait for real scraping to complete
        setJobs([]);
        sources.forEach(source => {
          setErrors(prev => ({
            ...prev,
            [source]: 'Taking longer than expected. Real jobs loading in background.'
          }));
        });
        console.log('📋 Showing empty results while real scraping continues');
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
    
    // Use Indeed, JobMail, and CareerJunction for comprehensive results
    return scrapeJobs({
      ...options,
      sources: ['indeed', 'jobmail', 'careerjunction']
    });
  }, [scrapeJobs]);

  // Get jobs from a specific source or all sources
  const getJobs = (source?: 'indeed' | 'pnet' | 'careerjunction' | 'career24' | 'linkedin' | 'jobmail') => {
    if (!Array.isArray(jobs)) return [];
    if (source) {
      return jobs.filter(job => job.source === source);
    }
    return jobs;
  };

  // Get loading state for a specific source or any source
  const getIsLoading = (source?: 'indeed' | 'pnet' | 'careerjunction' | 'career24' | 'linkedin' | 'jobmail') => {
    if (source) {
      return !!isLoading[source];
    }
    return Object.values(isLoading).some(loading => loading);
  };

  // Get error for a specific source or any source
  const getError = (source?: 'indeed' | 'pnet' | 'careerjunction' | 'career24' | 'linkedin' | 'jobmail') => {
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
