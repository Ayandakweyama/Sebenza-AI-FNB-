import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Test interviews endpoint called');

    // Return empty array for testing
    const interviews: any[] = [];

    console.log('Returning test interviews:', interviews);
    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Error in test interviews endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch test interviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
