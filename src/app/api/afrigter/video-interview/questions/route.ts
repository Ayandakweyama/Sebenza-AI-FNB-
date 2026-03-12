import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const interviewSession = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { response: true },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session: interviewSession,
      questions: interviewSession.questions,
    });
  } catch (error) {
    console.error('[Interview API] Questions error:', error);
    return NextResponse.json({ error: 'Failed to get questions' }, { status: 500 });
  }
}
