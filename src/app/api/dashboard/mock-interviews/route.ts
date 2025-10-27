import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return empty interviews array without authentication
    const interviews: any[] = [];

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Error in mock-interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mock interviews' },
      { status: 500 }
    );
  }
}
