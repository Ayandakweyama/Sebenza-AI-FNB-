import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    // Return default stats for now
    // Once the Prisma types are properly updated, we'll fetch real data
    const stats = [
      {
        title: 'Applications Sent',
        value: '0',
        change: 'Start applying to jobs',
        icon: '📊',
        color: 'purple'
      },
      {
        title: 'Interviews',
        value: '0',
        change: 'No interviews yet',
        icon: '🎯',
        color: 'green'
      },
      {
        title: 'Profile Views',
        value: '0',
        change: 'Complete your profile',
        icon: '👀',
        color: 'blue'
      },
      {
        title: 'Response Rate',
        value: '0%',
        change: 'Apply to get responses',
        icon: '📈',
        color: 'yellow'
      }
    ];

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in stats-simple:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
