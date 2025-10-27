import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return empty applications array without authentication
    const applications: any[] = [];

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error in mock-applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mock applications' },
      { status: 500 }
    );
  }
}
