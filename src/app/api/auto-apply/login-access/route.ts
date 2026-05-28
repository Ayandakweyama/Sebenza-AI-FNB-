import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

function cookieNameForSession(sessionId: string) {
  return `sebenza_auto_apply_access_${sessionId}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const autoSession = await prisma.autoApplySession.findFirst({
      where: { id: sessionId, userId: user.id },
    });

    if (!autoSession || !autoSession.loginToken || !autoSession.loginExpiresAt) {
      return NextResponse.json({ error: 'Login window is not active' }, { status: 404 });
    }

    if (autoSession.loginExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Login window expired' }, { status: 410 });
    }

    const secret = randomUUID();
    const secretHash = createHash('sha256').update(secret).digest('hex');

    await prisma.autoApplySession.update({
      where: { id: autoSession.id },
      data: { loginSecretHash: secretHash },
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set(cookieNameForSession(autoSession.id), secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: autoSession.loginExpiresAt,
    });
    return res;
  } catch (error) {
    console.error('[AutoApply API] login-access error:', error);
    return NextResponse.json({ error: 'Failed to enable login access' }, { status: 500 });
  }
}
