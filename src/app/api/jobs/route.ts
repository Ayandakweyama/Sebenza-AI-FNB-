import { NextResponse } from 'next/server';

// Helper function to validate environment variables
function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Fallback job data in case the API fails
const FALLBACK_JOBS = [
  {
    id: 'fallback-1',
    title: 'Software Developer',
    company: 'Tech Solutions Inc.',
    location: 'Cape Town, South Africa',
    salary: 'R45,000 - R65,000',
    description: 'We are looking for a skilled Software Developer to join our team. Experience with modern web technologies required.',
    postedDate: new Date().toISOString(),
    jobType: 'Full-time',
    skills: ['JavaScript', 'React', 'Node.js']
  },
  {
    id: 'fallback-2',
    title: 'Frontend Engineer',
    company: 'Digital Innovations',
    location: 'Johannesburg, South Africa',
    salary: 'R50,000 - R70,000',
    description: 'Join our frontend team to build amazing user experiences with modern web technologies.',
    postedDate: new Date().toISOString(),
    jobType: 'Full-time',
    skills: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS']
  }
];

export async function POST() {
  try {
    // Get API key with validation
    const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;
    
    // If no API key, use fallback data
    if (!JOOBLE_API_KEY) {
      console.warn('Jooble API key not found. Using fallback job data.');
      return NextResponse.json(FALLBACK_JOBS);
    }
    
    const JOOBLE_API_URL = 'https://jooble.org/api/' + JOOBLE_API_KEY;
    
    console.log('Jooble API URL:', JOOBLE_API_URL.replace(JOOBLE_API_KEY, '*****'));
    
    // Search parameters for South Africa
    const requestData = {
      keywords: 'software developer',
      location: 'South Africa',
      radius: 25,
      page: 1,
      limit: 10
    };

    console.log('Sending request to Jooble API with data:', requestData);
    
    const response = await fetch(JOOBLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('Jooble API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jooble API error response:', errorText);
      console.warn('Using fallback job data due to API error');
      return NextResponse.json(FALLBACK_JOBS);
    }

    const responseText = await response.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error('Failed to parse Jooble API response:', parseError);
      console.warn('Using fallback job data due to parse error');
      return NextResponse.json(FALLBACK_JOBS);
    }
    
    console.log('Jooble API response data (first 2 jobs):', data.jobs?.slice(0, 2));
    
    // If no jobs in response, use fallback data
    if (!data?.jobs || !Array.isArray(data.jobs) || data.jobs.length === 0) {
      console.warn('No jobs found in API response. Using fallback job data.');
      return NextResponse.json(FALLBACK_JOBS);
    }

    // Transform the data to match our Job type
    const transformedJobs = data.jobs.map((job: any) => ({
      id: job.id || `job-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || 'Job Title Not Available',
      company: job.company || 'Company Not Specified',
      location: job.location || 'Location Not Specified',
      salary: job.salary || 'Salary Not Specified',
      description: job.snippet || 'No description available',
      url: job.link || '#',
      postedDate: job.updated || new Date().toISOString(),
      jobType: job.type || 'Full-time',
      companyLogo: job.company_logo || '',
      skills: job.skills || ['Technology', 'Software Development']
    }));

    return NextResponse.json(transformedJobs);
  } catch (error) {
    console.error('Error in jobs API route:', error);
    console.warn('Using fallback job data due to error');
    return NextResponse.json(FALLBACK_JOBS);
  }
}

export const dynamic = 'force-dynamic';
