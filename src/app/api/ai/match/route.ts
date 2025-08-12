import { NextResponse } from 'next/server';
import { jobAIService } from '@/lib/ai/jobService';

export async function POST(request: Request) {
  try {
    const { jobDescription, skills, experience } = await request.json();

    if (!jobDescription || !skills || !experience) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await jobAIService.matchSkillsToJob(
      jobDescription,
      skills,
      experience
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in job matching:', error);
    return NextResponse.json(
      { error: 'Failed to process job matching' },
      { status: 500 }
    );
  }
}
