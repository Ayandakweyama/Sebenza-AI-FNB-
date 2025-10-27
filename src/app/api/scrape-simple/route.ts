import { NextResponse } from 'next/server';
import type { Job } from '@/lib/scrapers/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Mock jobs for testing while we fix the scraper
const MOCK_JOBS: Job[] = [
  {
    title: 'Senior Software Engineer',
    company: 'Tech Solutions SA',
    location: 'Cape Town, South Africa',
    salary: 'R60,000 - R80,000',
    postedDate: '2 days ago',
    description: 'We are seeking a talented Senior Software Engineer to join our growing team. You will work on cutting-edge projects using modern technologies including React, Node.js, and cloud platforms. This is a great opportunity to make an impact in a fast-paced environment.',
    jobType: 'Full-time',
    url: 'https://example.com/job/1',
    source: 'indeed' as const
  },
  {
    title: 'Full Stack Developer',
    company: 'Digital Innovations',
    location: 'Johannesburg, South Africa',
    salary: 'R50,000 - R70,000',
    postedDate: '1 day ago',
    description: 'Join our team as a Full Stack Developer. Work with React, TypeScript, Next.js on the frontend and Node.js, PostgreSQL on the backend. Great benefits and work-life balance.',
    jobType: 'Full-time',
    industry: 'Technology',
    url: 'https://example.com/job/2',
    source: 'pnet' as const
  },
  {
    title: 'Frontend Developer',
    company: 'Creative Studio',
    location: 'Cape Town, South Africa',
    salary: 'R45,000 - R65,000',
    postedDate: '3 days ago',
    description: 'Looking for a passionate Frontend Developer to create beautiful, responsive web applications. Experience with React, TypeScript, and modern CSS frameworks required.',
    jobType: 'Full-time',
    url: 'https://example.com/job/3',
    source: 'careerjunction' as const
  },
  {
    title: 'Backend Engineer',
    company: 'Data Systems Inc',
    location: 'Durban, South Africa',
    salary: 'R55,000 - R75,000',
    postedDate: '1 week ago',
    description: 'We need a Backend Engineer with strong experience in Node.js, Express, and database design. You will be building scalable APIs and microservices.',
    jobType: 'Full-time',
    industry: 'Technology',
    url: 'https://example.com/job/4',
    source: 'indeed' as const
  },
  {
    title: 'DevOps Engineer',
    company: 'Cloud Solutions',
    location: 'Pretoria, South Africa',
    salary: 'R65,000 - R85,000',
    postedDate: '5 days ago',
    description: 'Seeking a DevOps Engineer to manage our cloud infrastructure. Experience with AWS, Docker, Kubernetes, and CI/CD pipelines essential.',
    jobType: 'Full-time',
    url: 'https://example.com/job/5',
    source: 'pnet' as const
  },
  {
    title: 'React Developer',
    company: 'App Builders',
    location: 'Cape Town, South Africa',
    salary: 'R48,000 - R68,000',
    postedDate: '2 weeks ago',
    description: 'Join our team to build modern web applications using React, Redux, and TypeScript. We offer flexible working hours and remote options.',
    jobType: 'Full-time',
    url: 'https://example.com/job/6',
    source: 'careerjunction' as const
  },
  {
    title: 'Software Engineer',
    company: 'FinTech Startup',
    location: 'Johannesburg, South Africa',
    salary: 'R70,000 - R90,000',
    postedDate: '4 days ago',
    description: 'Exciting opportunity at a fast-growing FinTech startup. Work on innovative payment solutions using modern tech stack. Equity options available.',
    jobType: 'Full-time',
    industry: 'Finance',
    url: 'https://example.com/job/7',
    source: 'indeed' as const
  },
  {
    title: 'Mobile App Developer',
    company: 'Mobile First',
    location: 'Cape Town, South Africa',
    salary: 'R52,000 - R72,000',
    postedDate: '1 day ago',
    description: 'Build cross-platform mobile apps using React Native. Experience with iOS and Android development required.',
    jobType: 'Full-time',
    url: 'https://example.com/job/8',
    source: 'pnet' as const
  },
  {
    title: 'Software Architect',
    company: 'Enterprise Solutions',
    location: 'Johannesburg, South Africa',
    salary: 'R80,000 - R100,000',
    postedDate: '1 week ago',
    description: 'Lead the technical architecture for enterprise-scale applications. 5+ years experience required. Design scalable, maintainable systems.',
    jobType: 'Full-time',
    industry: 'Technology',
    url: 'https://example.com/job/9',
    source: 'careerjunction' as const
  },
  {
    title: 'Junior Developer',
    company: 'Learning Labs',
    location: 'Cape Town, South Africa',
    salary: 'R30,000 - R45,000',
    postedDate: '3 days ago',
    description: 'Great opportunity for a Junior Developer to learn and grow. Mentorship provided. Work with modern web technologies.',
    jobType: 'Full-time',
    url: 'https://example.com/job/10',
    source: 'indeed' as const
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, location } = body;

    console.log(`📋 Simple scraper - Query: "${query}", Location: "${location}"`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Filter jobs based on query (basic matching)
    const filteredJobs = MOCK_JOBS.filter(job => {
      const searchTerm = query.toLowerCase();
      return (
        job.title.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm)
      );
    });

    console.log(`✅ Returning ${filteredJobs.length} mock jobs`);

    return NextResponse.json({
      success: true,
      jobs: filteredJobs.length > 0 ? filteredJobs : MOCK_JOBS, // Return all if no matches
      count: filteredJobs.length > 0 ? filteredJobs.length : MOCK_JOBS.length,
      sourceCounts: {
        indeed: filteredJobs.filter(j => j.source === 'indeed').length,
        pnet: filteredJobs.filter(j => j.source === 'pnet').length,
        careerjunction: filteredJobs.filter(j => j.source === 'careerjunction').length
      }
    });

  } catch (error) {
    console.error('❌ Simple scraper error:', error);
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
