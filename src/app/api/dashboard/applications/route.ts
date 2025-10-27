import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent applications with job details
    const recentApplications = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    });

    // Format applications for the dashboard
    const formattedApplications = recentApplications.map(app => {
      // Calculate time ago
      const timeAgo = getTimeAgo(app.createdAt);
      
      // Map status to display format
      let statusDisplay = '';
      let statusColor = 'blue';
      
      switch (app.status) {
        case 'APPLIED':
          statusDisplay = 'Application Sent';
          statusColor = 'blue';
          break;
        case 'REVIEWING':
          statusDisplay = 'Under Review';
          statusColor = 'yellow';
          break;
        case 'INTERVIEW':
          statusDisplay = 'Interview Scheduled';
          statusColor = 'green';
          break;
        case 'OFFER':
          statusDisplay = 'Offer Received';
          statusColor = 'purple';
          break;
        case 'REJECTED':
          statusDisplay = 'Not Selected';
          statusColor = 'red';
          break;
        case 'WITHDRAWN':
          statusDisplay = 'Withdrawn';
          statusColor = 'gray';
          break;
        default:
          statusDisplay = app.status;
          statusColor = 'gray';
      }

      return {
        id: app.id,
        company: app.job.company?.name || 'Unknown Company',
        position: app.job.title,
        status: statusDisplay,
        time: timeAgo,
        color: statusColor,
        applicationDate: app.createdAt
      };
    });

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent applications' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  } else {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
}
