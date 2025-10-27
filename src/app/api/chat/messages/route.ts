import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/chat/messages - Add message to chat session
export async function POST(request: NextRequest) {
  // Apply rate limiting for AI chat operations
  const rateLimitResult = await rateLimiters.ai.check(request);
  if (!rateLimitResult.success) {
    return rateLimitResponse('Too many chat requests. Please wait a moment before sending another message.');
  }
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { sessionId, role, content, tokens, model } = body;

    if (!sessionId || !role || !content) {
      return NextResponse.json({ error: 'Session ID, role, and content are required' }, { status: 400 });
    }

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        tokens,
        model,
      },
    });

    // Update session metadata
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessageAt: new Date(),
        messageCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
