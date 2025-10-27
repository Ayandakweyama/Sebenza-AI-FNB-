import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST /api/profile/career/milestones - Add new milestone
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure career journey exists
    let journey = await prisma.careerJourney.findUnique({
      where: { userId: user.id }
    });

    if (!journey) {
      journey = await prisma.careerJourney.create({
        data: {
          userId: user.id
        }
      });
    }

    const { title, description, type, status, targetDate } = await request.json();

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const milestone = await prisma.careerMilestone.create({
      data: {
        careerJourneyId: journey.id,
        title,
        description,
        type,
        status: status || 'planned',
        targetDate: targetDate ? new Date(targetDate) : null
      }
    });

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('Error adding milestone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
