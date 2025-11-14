import { NextResponse } from 'next/server';
import { scrapeIndeed, scrapePnet, scrapeCareerJunction, scrapeCareer24, scrapeLinkedIn, scrapeJobMail } from '@/lib/scrapers';
import type { ScraperConfig, Job } from '@/lib/scrapers/types';
import { jobCache } from '@/lib/cache/jobCache';

export const maxDuration = 300; // 300 seconds (5 minutes) max for Vercel to allow 3 minute scraping
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple rate limiting
const activeRequests = new Map<string, number>();
const MAX_CONCURRENT_REQUESTS = 3;

interface RequestBody {
  query: string;
  location: string;
  maxPages?: number;
  sources?: ('indeed' | 'pnet' | 'careerjunction' | 'career24' | 'linkedin' | 'jobmail')[];
}

export async function POST(request: Request) {
  const body: RequestBody = await request.json();
  const { query, location, maxPages = 1, sources = ['indeed'] } = body; // Default to 1 page for faster response
  
  // Rate limiting check
  const requestKey = `${query}-${location}`;
  const currentCount = activeRequests.get(requestKey) || 0;
  
  if (currentCount >= MAX_CONCURRENT_REQUESTS) {
    console.warn(`⚠️ Rate limit exceeded for "${requestKey}": ${currentCount} active requests`);
    return NextResponse.json(
      { success: false, error: 'Too many concurrent requests for this search. Please wait a moment and try again.' },
      { status: 429 }
    );
  }
  
  // Increment active request count
  activeRequests.set(requestKey, currentCount + 1);
  
  try {
    if (!query || !location) {
      return NextResponse.json(
        { success: false, error: 'Query and location are required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting multi-source job scrape: ${sources.join(', ')}`);
    console.log(`   Query: "${query}", Location: "${location}", Max Pages: ${maxPages}`);

    // Check cache first
    const cachedJobs = jobCache.get(query, location, sources);
    if (cachedJobs && cachedJobs.length > 0) {
      console.log(`⚡ Cache hit! Returning ${cachedJobs.length} cached jobs`);
      return NextResponse.json({
        success: true,
        jobs: cachedJobs,
        count: cachedJobs.length,
        totalCount: cachedJobs.length,
        duplicatesRemoved: 0,
        sourceCounts: sources.reduce((acc, source) => {
          acc[source] = cachedJobs.filter(job => job.source === source).length;
          return acc;
        }, {} as Record<string, number>),
        cached: true,
        cacheAge: 'fresh'
      });
    }

    const config: ScraperConfig = { query, location, maxPages };
    
    // Run scrapers with timeout protection
    console.log(`\n🚀 Starting parallel scraping of ${sources.length} sources...`);
    
    const scraperPromises = sources.map(async (source) => {
      console.log(`📌 Starting ${source} scraper...`);
      
      // Create a timeout promise for each scraper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${source} scraper timed out after 180 seconds`)), 180000);
      });
      
      try {
        let scraperPromise;
        if (source === 'indeed') {
          scraperPromise = scrapeIndeed(config);
        } else if (source === 'pnet') {
          scraperPromise = scrapePnet(config);
        } else if (source === 'careerjunction') {
          scraperPromise = scrapeCareerJunction(config);
        } else if (source === 'career24') {
          scraperPromise = scrapeCareer24(config);
        } else if (source === 'linkedin') {
          scraperPromise = scrapeLinkedIn(config);
        } else if (source === 'jobmail') {
          scraperPromise = scrapeJobMail(config);
        } else {
          scraperPromise = Promise.resolve({
            jobs: [],
            success: false,
            error: `Unknown source: ${source}`,
            source,
            count: 0
          });
        }
        
        // Race between scraper and timeout
        const result = await Promise.race([scraperPromise, timeoutPromise]);
        return result;
      } catch (error) {
        console.error(`Failed to scrape ${source}:`, error);
        return {
          jobs: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          source,
          count: 0
        };
      }
    });
    
    // Wait for all scrapers to complete (parallel execution)
    const results = await Promise.allSettled(scraperPromises);
    
    const allJobs: Job[] = [];
    const errors: string[] = [];
    const sourceCounts: Record<string, number> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const scraperResult = result.value as any;
        if (scraperResult && scraperResult.success) {
          allJobs.push(...scraperResult.jobs);
          sourceCounts[scraperResult.source] = scraperResult.count;
          console.log(`✅ ${scraperResult.source}: ${scraperResult.count} jobs`);
        } else if (scraperResult) {
          errors.push(`${scraperResult.source}: ${scraperResult.error}`);
          console.error(`❌ ${scraperResult.source}: ${scraperResult.error}`);
        }
      } else {
        const source = sources[index] || `Scraper ${index + 1}`;
        errors.push(`${source} failed: ${result.reason}`);
        console.error(`❌ ${source} failed:`, result.reason);
      }
    });

    const uniqueJobs = allJobs.filter((job, index, self) => {
      const identifier = job.url || `${job.title}-${job.company}-${job.location}`;
      return self.findIndex(j => (j.url || `${j.title}-${j.company}-${j.location}`) === identifier) === index;
    });

    const duplicatesRemoved = allJobs.length - uniqueJobs.length;

    console.log(`🎉 Total jobs: ${allJobs.length}, Unique: ${uniqueJobs.length}, Duplicates removed: ${duplicatesRemoved}`);

    // If no jobs found, return empty array
    if (uniqueJobs.length === 0) {
      console.log('⚠️ No jobs found from scrapers');
      return NextResponse.json({
        success: true,
        jobs: [],
        count: 0,
        totalCount: 0,
        duplicatesRemoved: 0,
        sourceCounts: {
          indeed: 0,
          pnet: 0,
          careerjunction: 0,
          career24: 0,
          linkedin: 0,
          jobmail: 0
        },
        errors: errors.length > 0 ? errors : ['No jobs found. Please try different search terms or location.'],
        cached: false
      });
    }

    // Cache the results for future requests
    if (uniqueJobs.length > 0) {
      jobCache.set(query, location, sources, uniqueJobs);
    }

    return NextResponse.json({
      success: true,
      jobs: uniqueJobs,
      count: uniqueJobs.length,
      totalCount: allJobs.length,
      duplicatesRemoved,
      sourceCounts,
      errors: errors.length > 0 ? errors : undefined,
      cached: false
    });

  } catch (error) {
    console.error('❌ Multi-scraper error:', error);
    
    // Try fallback API
    try {
      console.log('🔄 Attempting fallback to Adzuna API...');
      const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/scrape-fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, maxPages })
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Fallback successful');
        return NextResponse.json(fallbackData);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    // Return error if all scraping failed
    console.log('⚠️ All scraping failed');
    return NextResponse.json({
      success: false,
      jobs: [],
      count: 0,
      totalCount: 0,
      duplicatesRemoved: 0,
      sourceCounts: {
        indeed: 0,
        pnet: 0,
        careerjunction: 0,
        career24: 0,
        linkedin: 0,
        jobmail: 0
      },
      errors: ['Unable to fetch jobs at this time. Please try again later.'],
      cached: false
    });
  } finally {
    // Decrement active request count
    const currentCount = activeRequests.get(requestKey) || 0;
    if (currentCount <= 1) {
      activeRequests.delete(requestKey);
    } else {
      activeRequests.set(requestKey, currentCount - 1);
    }
    console.log(`📊 Active requests for "${requestKey}": ${activeRequests.get(requestKey) || 0}`);
  }
}
