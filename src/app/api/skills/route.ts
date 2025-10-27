import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/skills - Get user skills
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const skills = await prisma.skill.findMany({
      where: {
        userId: user.id,
        ...(category && { category })
      },
      orderBy: [
        { category: 'asc' },
        { level: 'desc' }
      ]
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/skills - Create or update skill
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, proficiency, level } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json({ 
        error: 'Name and category are required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if skill already exists
    const existingSkill = await prisma.skill.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        category
      }
    });

    if (existingSkill) {
      // Update existing skill
      const updatedSkill = await prisma.skill.update({
        where: { id: existingSkill.id },
        data: {
          proficiency: proficiency || existingSkill.proficiency,
          level: level !== undefined ? level : existingSkill.level
        }
      });
      return NextResponse.json(updatedSkill);
    } else {
      // Create new skill
      const skill = await prisma.skill.create({
        data: {
          userId: user.id,
          name: name.trim(),
          category,
          proficiency: proficiency || 'intermediate',
          level: level !== undefined ? level : 2
        }
      });
      return NextResponse.json(skill, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating skill:', error);
    return NextResponse.json({ 
      error: 'Failed to save skill',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
