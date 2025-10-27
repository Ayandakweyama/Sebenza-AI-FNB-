import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/career-journey/milestones - Get career milestones
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
      where: { userId: user.id }
    });

    if (!careerJourney) {
      return NextResponse.json([]);
    }

    const milestones = await prisma.careerMilestone.findMany({
      where: { careerJourneyId: careerJourney.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/career-journey/milestones - Create milestone
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, type, targetDate } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let careerJourney = await prisma.careerJourney.findUnique({
      where: { userId: user.id }
    });

    if (!careerJourney) {
      // Create career journey if it doesn't exist
      careerJourney = await prisma.careerJourney.create({
        data: { userId: user.id }
      });
    }

    const milestone = await prisma.careerMilestone.create({
      data: {
        careerJourneyId: careerJourney.id,
        title,
        description,
        type,
        targetDate: targetDate ? new Date(targetDate) : null
      }
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
