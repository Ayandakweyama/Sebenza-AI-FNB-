import { NextResponse } from 'next/server';
import { scrapeIndeed } from '@/lib/scrapers';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Testing Indeed scraper...');
    const result = await scrapeIndeed({
      query: 'software developer',
      location: 'Johannesburg',
      maxPages: 1
    });
    
    return NextResponse.json({
      success: result.success,
      jobsFound: result.count,
      jobs: result.jobs.slice(0, 5), // Return first 5 jobs for testing
      error: result.error
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
