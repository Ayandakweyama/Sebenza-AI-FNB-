import { NextResponse } from 'next/server';
import type { Job } from '@/lib/scrapers/types';

export const maxDuration = 10; // Quick 10 second timeout
export const dynamic = 'force-dynamic';

// Enhanced job generator with more realistic data
function generateQuickJobs(query: string, location: string, count: number = 25): Job[] {
  const companies = [
    'Tech Solutions SA', 'Digital Innovations', 'Cloud Systems', 'Data Analytics Corp',
    'Software House', 'IT Consultants', 'Web Developers Inc', 'Mobile Apps Co',
    'Cyber Security Ltd', 'AI Research Lab', 'FinTech Solutions', 'E-Commerce Hub',
    'Startup Accelerator', 'Innovation Labs', 'Digital Agency SA', 'Tech Startup',
    'Global Tech Corp', 'Software Factory', 'Code Masters', 'Dev House SA',
    'Tech Giants Africa', 'Digital Transformation Co', 'Cloud Experts', 'Data Science Hub',
    'Blockchain Solutions', 'IoT Innovations', 'Machine Learning Co', 'Robotics Lab'
  ];
  
  const jobTypes = ['Full-time', 'Contract', 'Remote', 'Hybrid', 'Part-time', 'Freelance'];
  const salaryRanges = [
    'R25,000 - R35,000', 'R35,000 - R50,000', 'R50,000 - R70,000',
    'R70,000 - R90,000', 'R90,000 - R120,000', 'R120,000 - R180,000',
    'R180,000 - R250,000', 'Market Related', 'Competitive Package'
  ];
  
  const jobs: Job[] = [];
  
  // Generate diverse job titles based on query
  const jobLevels = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Principal', 'Staff'];
  const jobVariations = [
    query,
    `${query} Specialist`,
    `${query} Developer`,
    `${query} Engineer`,
    `${query} Consultant`,
    `${query} Architect`,
    `${query} Manager`,
    `${query} Analyst`
  ];
  
  for (let i = 0; i < count; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const salary = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const level = jobLevels[Math.floor(Math.random() * jobLevels.length)];
    const variation = jobVariations[Math.floor(Math.random() * jobVariations.length)];
    
    jobs.push({
      id: `quick-${Date.now()}-${i}`,
      title: `${level} ${variation}`,
      company,
      location: location || 'South Africa',
      salary,
      postedDate: `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`,
      description: `⚡ Quick result - Real jobs still loading...\n\nWe are looking for a talented ${level} ${variation} to join our ${company} team in ${location}. This ${jobType.toLowerCase()} position offers ${salary} and the opportunity to work with cutting-edge technologies. Join us to make a real impact in the tech industry.`,
      jobType,
      industry: 'Technology',
      url: `https://example.com/job/${i}`,
      source: 'quick-search' as const
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
    
    // DISABLED: No sample data should be served - only real scraped jobs
    console.log(`❌ Quick search disabled: "${query}" in "${location}" - only real jobs allowed`);
    
    return NextResponse.json({
      success: false,
      jobs: [],
      count: 0,
      message: 'Quick search disabled - waiting for real job scraping to complete',
      disabled: true
    });
    
  } catch (error) {
    console.error('Quick search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Quick search disabled',
        jobs: []
      },
      { status: 503 } // Service Unavailable
    );
  }
}
