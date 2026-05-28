import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitApprovalDecision } from '@/lib/agents/indeedAutoApply';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, logId, decision } = body as {
      sessionId?: string;
      logId?: string;
      decision?: 'approve' | 'skip';
    };

    if (!sessionId || !logId || (decision !== 'approve' && decision !== 'skip')) {
      return NextResponse.json(
        { error: 'sessionId, logId and decision (approve|skip) are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const log = await prisma.autoApplyLog.findFirst({
      where: { id: logId, sessionId },
      include: { session: true },
    });

    if (!log || log.session.userId !== user.id) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    submitApprovalDecision(logId, decision);

    if (decision === 'skip') {
      await prisma.autoApplyLog.update({
        where: { id: logId },
        data: { status: 'skipped', skipReason: 'Rejected by user' },
      });
    } else {
      await prisma.autoApplyLog.update({
        where: { id: logId },
        data: { status: 'approved' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AutoApply API] Decision error:', error);
    return NextResponse.json({ error: 'Failed to submit decision' }, { status: 500 });
  }
}
