import { NextResponse } from 'next/server';
import type { Job } from '@/lib/scrapers/types';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface AdzunaJob {
  title: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
  };
  salary_min?: number;
  salary_max?: number;
  created: string;
  description: string;
  redirect_url: string;
  contract_type?: string;
  category: {
    label: string;
  };
}

export async function POST(request: Request) {
  // Apply rate limiting for scraping operations
  const rateLimitResult = await rateLimiters.scraping.check(request as any);
  if (!rateLimitResult.success) {
    return rateLimitResponse('Too many scraping requests. Please wait a moment before trying again.');
  }
  
  try {
    const body = await request.json();
    const { query, location, maxPages = 1 } = body;

    console.log(`🌐 Fallback scraper - Using Adzuna API`);
    console.log(`   Query: "${query}", Location: "${location}"`);

    // Check if Adzuna API keys are configured
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
    
    if (ADZUNA_APP_ID && ADZUNA_APP_KEY) {
      // Use real Adzuna API
      try {
        const country = 'za'; // South Africa
        const page = 1;
        const resultsPerPage = 20;
        
        const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?` +
          `app_id=${ADZUNA_APP_ID}&` +
          `app_key=${ADZUNA_APP_KEY}&` +
          `results_per_page=${resultsPerPage}&` +
          `what=${encodeURIComponent(query)}&` +
          `where=${encodeURIComponent(location)}&` +
          `content-type=application/json`;
        
        const response = await fetch(adzunaUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          const jobs: Job[] = data.results.map((job: any) => ({
            id: job.id || `adzuna-${Date.now()}-${Math.random()}`,
            title: job.title,
            company: job.company?.display_name || 'Company not specified',
            location: job.location?.display_name || location,
            salary: job.salary_min && job.salary_max 
              ? `R${job.salary_min.toLocaleString()} - R${job.salary_max.toLocaleString()} per year`
              : job.salary_min 
              ? `From R${job.salary_min.toLocaleString()} per year`
              : 'Salary not specified',
            postedDate: new Date(job.created).toLocaleDateString('en-ZA'),
            description: job.description || 'No description available',
            jobType: job.contract_type || 'Full-time',
            industry: job.category?.label || 'General',
            url: job.redirect_url,
            source: 'adzuna' as const
          }));
          
          console.log(`✅ Found ${jobs.length} jobs from Adzuna API`);
          
          return NextResponse.json({
            success: true,
            jobs,
            source: 'adzuna',
            message: `Found ${jobs.length} jobs matching your search`
          });
        } else {
          console.error('Adzuna API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching from Adzuna:', error);
      }
    }
    
    // No API keys configured - return empty result
    console.log('⚠️ Adzuna API keys not configured - unable to fetch real jobs');
    
    const allJobs: Job[] = [];
    
    // Uncomment this when you have Adzuna API keys:
    /*
    const APP_ID = process.env.ADZUNA_APP_ID;
    const APP_KEY = process.env.ADZUNA_APP_KEY;
    
    if (!APP_ID || !APP_KEY) {
      console.warn('Adzuna API keys not found. Using sample data.');
      const allJobs: Job[] = sampleJobs;
    } else {
      const resultsPerPage = 20;
      const allJobs: Job[] = [];
      
      for (let page = 1; page <= Math.min(maxPages, 3); page++) {
        const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/za/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&results_per_page=${resultsPerPage}`;
        
        try {
          const response = await fetch(adzunaUrl);
          
          if (!response.ok) {
            console.error(`Adzuna API error: ${response.status}`);
            break;
          }
          
          const data = await response.json();
          const results: AdzunaJob[] = data.results || [];
          
          console.log(`📄 Page ${page}: Found ${results.length} jobs from Adzuna`);
          
          const transformedJobs: Job[] = results.map((job: AdzunaJob) => ({
            title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            salary: job.salary_min && job.salary_max
              ? `R${job.salary_min.toLocaleString()} - R${job.salary_max.toLocaleString()}`
              : 'Competitive salary',
            postedDate: new Date(job.created).toLocaleDateString('en-ZA'),
            description: job.description.replace(/<[^>]*>/g, '').substring(0, 500),
            jobType: job.contract_type || 'Full-time',
            industry: job.category.label,
            url: job.redirect_url,
            source: 'indeed' as const
          }));
          
          allJobs.push(...transformedJobs);
          
          if (results.length < resultsPerPage) {
            break;
          }
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error);
          break;
        }
      }
    }
    */

    console.log(`✅ Total jobs returned: ${allJobs.length}`);

    return NextResponse.json({
      success: true,
      jobs: allJobs,
      count: allJobs.length,
      sourceCounts: {
        indeed: allJobs.filter(j => j.source === 'indeed').length,
        pnet: allJobs.filter(j => j.source === 'pnet').length,
        careerjunction: allJobs.filter(j => j.source === 'careerjunction').length,
        linkedin: 0
      },
      message: 'Sample jobs - add Adzuna API keys or fix Puppeteer for real scraping'
    });

  } catch (error) {
    console.error('❌ Fallback scraper error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        jobs: []
      },
      { status: 500 }
    );
  }
}
