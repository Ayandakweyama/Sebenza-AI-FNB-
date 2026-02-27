import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get user from DB
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: session.userId },
      });
    } catch {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the session belongs to this user before deleting
    const autoSession = await prisma.autoApplySession.findFirst({
      where: { id: sessionId, userId: user.id },
    });

    if (!autoSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Don't allow deleting active sessions
    if (autoSession.status === 'running' || autoSession.status === 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete an active session. Cancel it first.' },
        { status: 409 }
      );
    }

    // Delete the session (logs cascade-delete automatically)
    await prisma.autoApplySession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('[AutoApply API] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
