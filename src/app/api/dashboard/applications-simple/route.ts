import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Applications-simple endpoint called');
    
    const authResult = await auth();
    const { userId } = authResult;
    
    if (!userId) {
      console.log('No userId found in applications endpoint');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('UserId found in applications:', userId);

    // Return empty array for now - will be populated when users apply to jobs
    const applications: any[] = [];

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error in applications-simple endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch applications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
