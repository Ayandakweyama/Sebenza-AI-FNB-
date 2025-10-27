import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/job-preferences - Get job preferences
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { jobPreferences: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create default preferences if they don't exist
    if (!user.jobPreferences) {
      const preferences = await prisma.jobPreferences.create({
        data: {
          userId: user.id,
          desiredRoles: [],
          industries: [],
          locations: [],
          remoteWork: false,
          jobType: ['full-time'],
          companySize: [],
          skills: [],
          keywords: []
        }
      });
      return NextResponse.json(preferences);
    }

    return NextResponse.json(user.jobPreferences);
  } catch (error) {
    console.error('Error fetching job preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/job-preferences - Update job preferences
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = await prisma.jobPreferences.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        userId: user.id,
        ...body
      }
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating job preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
