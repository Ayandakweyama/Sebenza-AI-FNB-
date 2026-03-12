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
        report: true,
        job: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: interviewSession.id,
        title: interviewSession.title,
        type: interviewSession.type,
        difficulty: interviewSession.difficulty,
        status: interviewSession.status,
        overallScore: interviewSession.overallScore,
        startedAt: interviewSession.startedAt,
        completedAt: interviewSession.completedAt,
        createdAt: interviewSession.createdAt,
        jobTitle: interviewSession.job?.title || null,
      },
      questions: interviewSession.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        category: q.category,
        order: q.order,
        response: q.response ? {
          id: q.response.id,
          transcript: q.response.transcript,
          clarityScore: q.response.clarityScore,
          confidenceScore: q.response.confidenceScore,
          relevanceScore: q.response.relevanceScore,
          communicationScore: q.response.communicationScore,
          emotionScore: q.response.emotionScore,
          facialScore: q.response.facialScore,
          aiFeedback: q.response.aiFeedback,
          keywordsMatched: q.response.keywordsMatched,
          analysisStatus: q.response.analysisStatus,
          durationSecs: q.response.durationSecs,
        } : null,
      })),
      report: interviewSession.report,
    });
  } catch (error) {
    console.error('[Interview API] Report error:', error);
    return NextResponse.json({ error: 'Failed to get report' }, { status: 500 });
  }
}
