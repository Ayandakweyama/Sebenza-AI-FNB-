import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return mock stats data without authentication
    const stats = [
      {
        title: 'Applications Sent',
        value: '0',
        change: 'Start applying to jobs',
        icon: 'Send',
        color: 'purple'
      },
      {
        title: 'Interviews',
        value: '0',
        change: 'No interviews yet',
        icon: 'Calendar',
        color: 'green'
      },
      {
        title: 'Profile Views',
        value: '0',
        change: 'Complete your profile',
        icon: 'Eye',
        color: 'blue'
      },
      {
        title: 'Response Rate',
        value: '0%',
        change: 'Apply to get responses',
        icon: 'TrendingUp',
        color: 'yellow'
      }
    ];

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in mock-stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mock stats' },
      { status: 500 }
    );
  }
}
