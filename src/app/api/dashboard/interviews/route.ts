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

    // Get upcoming interviews
    const upcomingInterviews = await prisma.application.findMany({
      where: {
        userId: user.id,
        status: 'INTERVIEW',
        interviewDate: {
          gte: new Date()
        }
      },
      orderBy: { interviewDate: 'asc' },
      take: 5,
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    });

    // Format interviews for the dashboard
    const formattedInterviews = upcomingInterviews.map(app => {
      const interviewDate = app.interviewDate ? new Date(app.interviewDate) : null;
      
      // Format the interview time
      let timeDisplay = 'TBD';
      if (interviewDate) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const isToday = interviewDate.toDateString() === today.toDateString();
        const isTomorrow = interviewDate.toDateString() === tomorrow.toDateString();
        
        if (isToday) {
          timeDisplay = `Today, ${interviewDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}`;
        } else if (isTomorrow) {
          timeDisplay = `Tomorrow, ${interviewDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}`;
        } else {
          timeDisplay = interviewDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }

      // Determine interview type based on notes or default
      let interviewType = 'Initial';
      if (app.notes) {
        const notesLower = app.notes.toLowerCase();
        if (notesLower.includes('technical')) {
          interviewType = 'Technical';
        } else if (notesLower.includes('behavioral') || notesLower.includes('hr')) {
          interviewType = 'Behavioral';
        } else if (notesLower.includes('final')) {
          interviewType = 'Final';
        } else if (notesLower.includes('phone') || notesLower.includes('screening')) {
          interviewType = 'Phone Screening';
        }
      }

      return {
        id: app.id,
        company: app.job.company?.name || 'Unknown Company',
        position: app.job.title,
        time: timeDisplay,
        type: interviewType,
        interviewDate: app.interviewDate,
        location: app.job.location || 'Remote',
        notes: app.notes
      };
    });

    return NextResponse.json(formattedInterviews);
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming interviews' },
      { status: 500 }
    );
  }
}
