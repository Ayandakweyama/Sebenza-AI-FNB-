import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/profile/career - Get user career journey
export async function GET() {
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

    const journey = await prisma.careerJourney.findUnique({
      where: { userId: user.id },
      include: {
        milestones: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Error fetching career journey:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile/career - Update career goals
export async function PUT(request: NextRequest) {
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

    const { currentGoal, timeline, targetRole, targetIndustry } = await request.json();

    const journey = await prisma.careerJourney.upsert({
      where: { userId: user.id },
      update: {
        currentGoal,
        timeline,
        targetRole,
        targetIndustry
      },
      create: {
        userId: user.id,
        currentGoal,
        timeline,
        targetRole,
        targetIndustry
      },
      include: {
        milestones: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Error updating career journey:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
