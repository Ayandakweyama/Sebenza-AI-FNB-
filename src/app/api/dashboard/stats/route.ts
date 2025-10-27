import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }
    
    console.log('Fetching stats for userId:', userId);

    // Get the current date and date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);

    // Fetch user from database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      // Create user if doesn't exist
      console.log('User not found, creating new user for clerkId:', userId);
      
      // Get user details from Clerk
      const { user: clerkUser } = await auth();
      
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: 'user@example.com', // This will be updated by sync-user endpoint
          name: 'New User',
          profileViews: 0,
          monthlyProfileViews: 0,
          lastMonthProfileViews: 0
        }
      });
    }

    // Get application statistics
    const totalApplications = await prisma.application.count({
      where: { userId: user.id }
    });

    const weeklyApplications = await prisma.application.count({
      where: {
        userId: user.id,
        createdAt: { gte: startOfWeek }
      }
    });

    const lastWeekApplications = await prisma.application.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: startOfWeek
        }
      }
    });

    // Calculate percentage change
    const applicationChange = lastWeekApplications > 0 
      ? Math.round(((weeklyApplications - lastWeekApplications) / lastWeekApplications) * 100)
      : weeklyApplications > 0 ? 100 : 0;

    // Get interview count
    const totalInterviews = await prisma.application.count({
      where: {
        userId: user.id,
        status: 'INTERVIEW'
      }
    });

    const scheduledInterviews = await prisma.application.count({
      where: {
        userId: user.id,
        status: 'INTERVIEW',
        interviewDate: { gte: now }
      }
    });

    // Get profile views (we'll track this in the User model)
    const profileViews = user.profileViews || 0;
    const monthlyProfileViews = user.monthlyProfileViews || 0;
    const lastMonthViews = user.lastMonthProfileViews || 0;
    
    const viewsChange = lastMonthViews > 0
      ? Math.round(((monthlyProfileViews - lastMonthViews) / lastMonthViews) * 100)
      : monthlyProfileViews > 0 ? 100 : 0;

    // Calculate response rate
    const applicationsWithResponse = await prisma.application.count({
      where: {
        userId: user.id,
        status: {
          in: ['INTERVIEW', 'OFFER', 'REJECTED']
        }
      }
    });

    const responseRate = totalApplications > 0
      ? Math.round((applicationsWithResponse / totalApplications) * 100)
      : 0;

    // Industry average response rate (typically around 10-15%)
    const industryAverage = 12;
    const responseRateComparison = responseRate >= industryAverage ? 'Above average' : 'Below average';

    const stats = [
      {
        title: 'Applications Sent',
        value: totalApplications.toString(),
        change: applicationChange !== 0 
          ? `${applicationChange > 0 ? '+' : ''}${applicationChange}% this week`
          : 'No change this week',
        icon: '📊',
        color: 'purple'
      },
      {
        title: 'Interviews',
        value: totalInterviews.toString(),
        change: scheduledInterviews > 0 
          ? `+${scheduledInterviews} scheduled`
          : 'None scheduled',
        icon: '🎯',
        color: 'green'
      },
      {
        title: 'Profile Views',
        value: profileViews.toString(),
        change: viewsChange !== 0
          ? `${viewsChange > 0 ? '+' : ''}${viewsChange}% this month`
          : 'No change',
        icon: '👀',
        color: 'blue'
      },
      {
        title: 'Response Rate',
        value: `${responseRate}%`,
        change: responseRateComparison,
        icon: '📈',
        color: 'yellow'
      }
    ];

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
