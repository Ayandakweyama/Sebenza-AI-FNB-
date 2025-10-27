import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/profile/skills - Get user skills
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

    const skills = await prisma.skill.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/profile/skills - Add new skill
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

    const { name, category, proficiency, level } = await request.json();

    if (!name || !category || !proficiency) {
      return NextResponse.json({ error: 'Name, category, and proficiency are required' }, { status: 400 });
    }

    const skill = await prisma.skill.create({
      data: {
        userId: user.id,
        name,
        category,
        proficiency,
        level: level || 3,
        verified: false
      }
    });

    return NextResponse.json({ skill });
  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
