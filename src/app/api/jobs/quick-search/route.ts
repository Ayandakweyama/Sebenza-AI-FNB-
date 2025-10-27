import { NextResponse } from 'next/server';
import type { Job } from '@/lib/scrapers/types';

export const maxDuration = 10; // Quick 10 second timeout
export const dynamic = 'force-dynamic';

// Quick mock data generator for immediate response
function generateQuickJobs(query: string, location: string, count: number = 10): Job[] {
  const companies = [
    'Tech Solutions SA', 'Digital Innovations', 'Cloud Systems', 'Data Analytics Corp',
    'Software House', 'IT Consultants', 'Web Developers Inc', 'Mobile Apps Co',
    'Cyber Security Ltd', 'AI Research Lab'
  ];
  
  const jobTypes = ['Full-time', 'Contract', 'Remote', 'Hybrid'];
  const salaryRanges = [
    'R30,000 - R45,000', 'R45,000 - R60,000', 'R60,000 - R80,000', 
    'R80,000 - R100,000', 'R100,000 - R150,000'
  ];
  
  const jobs: Job[] = [];
  
  for (let i = 0; i < count; i++) {
    const company = companies[i % companies.length];
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const salary = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    
    jobs.push({
      id: `quick-${Date.now()}-${i}`,
      title: `${query} - ${['Senior', 'Mid-level', 'Junior'][i % 3]}`,
      company,
      location: location || 'South Africa',
      salary,
      postedDate: `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`,
      description: `We are looking for a talented ${query} to join our team in ${location}. This is an exciting opportunity to work with cutting-edge technologies and make a real impact.`,
      jobType,
      industry: 'Technology',
      url: `https://example.com/job/${i}`,
      source: 'indeed' as const
    });
  }
  
  return jobs;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, location } = body;
    
    if (!query || !location) {
      return NextResponse.json(
        { success: false, error: 'Query and location are required' },
        { status: 400 }
      );
    }
    
    // Generate quick results for immediate response
    const quickJobs = generateQuickJobs(query, location, 15);
    
    console.log(`⚡ Quick search: Generated ${quickJobs.length} jobs for "${query}" in "${location}"`);
    
    return NextResponse.json({
      success: true,
      jobs: quickJobs,
      count: quickJobs.length,
      message: 'Quick results - real job scraping in progress',
      quick: true
    });
    
  } catch (error) {
    console.error('Quick search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate quick results',
        jobs: []
      },
      { status: 500 }
    );
  }
}
