import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const questionId = formData.get('questionId') as string;
    const videoBlob = formData.get('video') as File | null;
    const facialMetricsRaw = formData.get('facialMetrics') as string | null;
    const durationSecs = Number(formData.get('durationSecs') || 0);

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the question belongs to the user's session
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: { session: true },
    });

    if (!question || question.session.userId !== user.id) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Save video file to local storage (in production, use S3/cloud storage)
    let videoUrl: string | null = null;
    if (videoBlob) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'interviews');
      await mkdir(uploadsDir, { recursive: true });

      const fileName = `${questionId}-${Date.now()}.webm`;
      const filePath = path.join(uploadsDir, fileName);
      const buffer = Buffer.from(await videoBlob.arrayBuffer());
      await writeFile(filePath, buffer);
      videoUrl = `/uploads/interviews/${fileName}`;
    }

    // Parse facial metrics from client-side MediaPipe analysis
    let facialMetrics = null;
    if (facialMetricsRaw) {
      try {
        facialMetrics = JSON.parse(facialMetricsRaw);
      } catch { /* ignore malformed metrics */ }
    }

    // Upsert the response record
    const response = await prisma.interviewResponse.upsert({
      where: { questionId },
      update: {
        videoUrl,
        durationSecs,
        analysisStatus: 'pending',
        analysisError: null,
      },
      create: {
        questionId,
        videoUrl,
        durationSecs,
        analysisStatus: 'pending',
      },
    });

    // Update session status to in_progress if it's still pending
    if (question.session.status === 'pending') {
      await prisma.interviewSession.update({
        where: { id: question.session.id },
        data: { status: 'in_progress', startedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      responseId: response.id,
      videoUrl,
      facialMetrics,
    });
  } catch (error) {
    console.error('[Interview API] Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
