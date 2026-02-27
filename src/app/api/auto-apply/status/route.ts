import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionControl, getSessionProgress } from '@/lib/agents/indeedAutoApply';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    // Try to get user from DB, but don't fail if DB is unreachable
    let user: { id: string } | null = null;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: session.userId },
      });
    } catch {
      // DB is down — use Clerk userId as fallback
      user = { id: session.userId };
    }

    if (!user) {
      // User not in DB yet — still allow status check with Clerk ID
      user = { id: session.userId };
    }

    // If sessionId provided, get that specific session
    if (sessionId) {
      const control = getSessionControl(sessionId);
      const inMemoryProgress = getSessionProgress(sessionId);

      // Try DB first
      let autoSession = null;
      try {
        autoSession = await prisma.autoApplySession.findFirst({
          where: { id: sessionId, userId: user.id },
          include: {
            logs: { orderBy: { createdAt: 'desc' } },
          },
        });
      } catch {
        // DB is down — fall back to in-memory progress
      }

      if (autoSession) {
        return NextResponse.json({
          session: autoSession,
          isActive: !!control,
          isPaused: control?.pause || false,
          ...(inMemoryProgress ? {
            liveProgress: {
              currentStep: inMemoryProgress.currentStep,
              currentJob: inMemoryProgress.currentJob,
              appliedCount: inMemoryProgress.appliedCount,
              skippedCount: inMemoryProgress.skippedCount,
              failedCount: inMemoryProgress.failedCount,
              totalFound: inMemoryProgress.totalFound,
              status: inMemoryProgress.status,
              logs: inMemoryProgress.logs?.slice(-10),
            },
          } : {}),
        });
      }

      // No DB session found — return in-memory progress if available
      if (inMemoryProgress) {
        return NextResponse.json({
          session: {
            id: sessionId,
            status: inMemoryProgress.status,
            appliedCount: inMemoryProgress.appliedCount,
            skippedCount: inMemoryProgress.skippedCount,
            failedCount: inMemoryProgress.failedCount,
            totalFound: inMemoryProgress.totalFound,
            logs: inMemoryProgress.logs?.slice(-10).map(log => ({
              ...log,
              createdAt: log.timestamp,
            })) || [],
          },
          liveProgress: {
            currentStep: inMemoryProgress.currentStep,
            currentJob: inMemoryProgress.currentJob,
            appliedCount: inMemoryProgress.appliedCount,
            skippedCount: inMemoryProgress.skippedCount,
            failedCount: inMemoryProgress.failedCount,
            totalFound: inMemoryProgress.totalFound,
            status: inMemoryProgress.status,
          },
          isActive: !!control,
          isPaused: control?.pause || false,
        });
      }

      // Nothing found at all
      if (control) {
        return NextResponse.json({
          session: { id: sessionId, status: 'running' },
          isActive: true,
          isPaused: control.pause,
        });
      }

      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Otherwise get all sessions for this user
    let sessions: any[] = [];
    try {
      sessions = await prisma.autoApplySession.findMany({
        where: { userId: user.id },
        include: {
          logs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    } catch {
      // DB is down — return empty sessions list
    }

    // Check which sessions are currently active
    const sessionsWithStatus = sessions.map((s: { id: string; [key: string]: unknown }) => ({
      ...s,
      isActive: !!getSessionControl(s.id),
      isPaused: getSessionControl(s.id)?.pause || false,
    }));

    return NextResponse.json({ sessions: sessionsWithStatus });
  } catch (error) {
    console.error('[AutoApply API] Status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
