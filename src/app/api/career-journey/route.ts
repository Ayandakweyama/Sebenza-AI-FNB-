import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/career-journey - Get user career journey
export async function GET() {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const careerJourney = await prisma.careerJourney.findUnique({
      where: { userId: user.id },
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!careerJourney) {
      return NextResponse.json({ message: 'Career journey not found' }, { status: 404 });
    }

    return NextResponse.json(careerJourney);
  } catch (error) {
    console.error('Error fetching career journey:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/career-journey - Create career journey
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentGoal, timeline, targetRole, targetIndustry } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const careerJourney = await prisma.careerJourney.create({
      data: {
        userId: user.id,
        currentGoal,
        timeline,
        targetRole,
        targetIndustry
      }
    });

    return NextResponse.json(careerJourney, { status: 201 });
  } catch (error) {
    console.error('Error creating career journey:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/career-journey - Update career journey
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentGoal, timeline, targetRole, targetIndustry } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const careerJourney = await prisma.careerJourney.upsert({
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
      }
    });

    return NextResponse.json(careerJourney);
  } catch (error) {
    console.error('Error updating career journey:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
