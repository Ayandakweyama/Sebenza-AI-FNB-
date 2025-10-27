import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple test endpoint that returns mock jobs immediately
    const testJobs = [
      {
        title: "Test Software Engineer",
        company: "Test Company",
        location: "Cape Town, South Africa",
        salary: "R400,000 - R600,000",
        url: "https://example.com/test-job",
        postedDate: "Just now",
        description: "This is a test job to verify the API is working...",
        jobType: "Full-time",
        industry: "Technology",
        source: "test"
      }
    ];

    return NextResponse.json({
      success: true,
      jobs: testJobs,
      count: testJobs.length,
      message: "Test endpoint working correctly",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Test endpoint failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
