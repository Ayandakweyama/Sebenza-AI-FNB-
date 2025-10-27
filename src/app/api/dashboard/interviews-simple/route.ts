import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Interviews-simple endpoint called');
    
    const authResult = await auth();
    console.log('Auth result:', authResult);
    
    const { userId } = authResult;
    
    if (!userId) {
      console.log('No userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('UserId found:', userId);

    // Return empty array for now - will be populated when users have interviews
    const interviews: any[] = [];

    console.log('Returning interviews:', interviews);
    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Error in interviews-simple endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch interviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
