import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelSession, pauseSession, resumeSession } from '@/lib/agents/indeedAutoApply';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, action } = body;

    if (!sessionId || !action) {
      return NextResponse.json({ error: 'sessionId and action are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify session belongs to user
    const autoSession = await prisma.autoApplySession.findFirst({
      where: { id: sessionId, userId: user.id },
    });

    if (!autoSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel':
        cancelSession(sessionId);
        await prisma.autoApplySession.update({
          where: { id: sessionId },
          data: { status: 'cancelled', completedAt: new Date() },
        });
        return NextResponse.json({ success: true, message: 'Session cancelled' });

      case 'pause':
        pauseSession(sessionId);
        await prisma.autoApplySession.update({
          where: { id: sessionId },
          data: { status: 'paused' },
        });
        return NextResponse.json({ success: true, message: 'Session paused' });

      case 'resume':
        resumeSession(sessionId);
        await prisma.autoApplySession.update({
          where: { id: sessionId },
          data: { status: 'running' },
        });
        return NextResponse.json({ success: true, message: 'Session resumed' });

      default:
        return NextResponse.json({ error: 'Invalid action. Use: cancel, pause, resume' }, { status: 400 });
    }
  } catch (error) {
    console.error('[AutoApply API] Control error:', error);
    return NextResponse.json({ error: 'Failed to control session' }, { status: 500 });
  }
}
