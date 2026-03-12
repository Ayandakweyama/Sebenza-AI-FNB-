import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeTranscript, transcribeAudio } from '@/lib/ai/interview/analyzeTranscript';
import { analyzeTone } from '@/lib/ai/interview/analyzeTone';
import { scoreFacialMetrics, type FacialMetrics } from '@/lib/ai/interview/analyzeFacialExpressions';
import { scoreResponse, scoreSession, type ResponseScores } from '@/lib/ai/interview/scoreInterview';
import { generateRecruiterReport } from '@/lib/ai/interview/generateRecruiterReport';
import { readFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      include: { profile: true, skills: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Load the session with all questions and responses
    const interviewSession = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { response: true },
        },
        job: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Mark session as analyzing
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: 'analyzing' },
    });

    // Return immediately — analysis runs in the background
    // The client will poll /api/interview/report for results
    runAnalysisPipeline(
      sessionId,
      interviewSession,
      user,
    ).catch(err => {
      console.error('[Interview API] Background analysis error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Analysis started. Poll /api/interview/report for results.',
      sessionId,
    });
  } catch (error) {
    console.error('[Interview API] Analyze error:', error);
    return NextResponse.json({ error: 'Failed to start analysis' }, { status: 500 });
  }
}

// ─── Background Analysis Pipeline ───────────────────────────────────────────

async function runAnalysisPipeline(
  sessionId: string,
  interviewSession: any,
  user: any,
) {
  const allResponseScores: ResponseScores[] = [];
  const questionsAndTranscripts: Array<{ question: string; transcript: string; feedback: string }> = [];
  const jobDescription = interviewSession.job?.description || '';
  const userSkills = user.skills?.map((s: { name: string }) => s.name) || [];

  for (const question of interviewSession.questions) {
    const response = question.response;
    if (!response) continue;

    try {
      // Mark response as processing
      await prisma.interviewResponse.update({
        where: { id: response.id },
        data: { analysisStatus: 'processing' },
      });

      // Step 1: Transcribe audio if we have a video but no transcript yet
      let transcript = response.transcript || '';
      if (!transcript && response.videoUrl) {
        try {
          const videoPath = path.join(process.cwd(), 'public', response.videoUrl);
          const audioBuffer = await readFile(videoPath);
          transcript = await transcribeAudio(audioBuffer, 'recording.webm');
        } catch (err) {
          console.warn(`[Interview] Transcription failed for response ${response.id}:`, err);
          transcript = '';
        }
      }

      // If we still have no transcript (e.g., user typed or no audio), skip deep analysis
      if (!transcript) {
        await prisma.interviewResponse.update({
          where: { id: response.id },
          data: {
            analysisStatus: 'completed',
            aiFeedback: 'No audio/transcript available for analysis.',
            clarityScore: 0,
            confidenceScore: 0,
            relevanceScore: 0,
            communicationScore: 0,
            emotionScore: 0,
            facialScore: 0,
          },
        });
        continue;
      }

      // Step 2: Analyze transcript
      const transcriptResult = await analyzeTranscript(
        transcript,
        question.questionText,
        jobDescription,
        userSkills,
      );

      // Step 3: Analyze tone
      const toneResult = await analyzeTone(transcript);

      // Step 4: Score facial metrics (sent from client during recording)
      let facialMetrics: FacialMetrics | null = null;
      if (response.detailedAnalysis && typeof response.detailedAnalysis === 'object') {
        const analysis = response.detailedAnalysis as Record<string, unknown>;
        if (analysis.facialMetrics) {
          facialMetrics = analysis.facialMetrics as FacialMetrics;
        }
      }
      const facialResult = scoreFacialMetrics(facialMetrics);

      // Step 5: Combine scores
      const scores = scoreResponse(transcriptResult, toneResult, facialResult);

      // Save to DB
      await prisma.interviewResponse.update({
        where: { id: response.id },
        data: {
          transcript,
          clarityScore: scores.clarityScore,
          confidenceScore: scores.confidenceScore,
          relevanceScore: scores.relevanceScore,
          communicationScore: scores.communicationScore,
          emotionScore: scores.emotionScore,
          facialScore: scores.facialScore,
          aiFeedback: scores.aiFeedback,
          keywordsMatched: scores.keywordsMatched,
          detailedAnalysis: scores.detailedAnalysis,
          analysisStatus: 'completed',
        },
      });

      allResponseScores.push(scores);
      questionsAndTranscripts.push({
        question: question.questionText,
        transcript,
        feedback: scores.aiFeedback,
      });
    } catch (err) {
      console.error(`[Interview] Error analyzing response ${response.id}:`, err);
      await prisma.interviewResponse.update({
        where: { id: response.id },
        data: {
          analysisStatus: 'failed',
          analysisError: err instanceof Error ? err.message : 'Unknown error',
        },
      });
    }
  }

  // Step 6: Compute session-level scores
  const sessionScores = scoreSession(allResponseScores);

  // Step 7: Generate recruiter report
  const recruiterReport = await generateRecruiterReport(
    sessionScores,
    questionsAndTranscripts,
    user.name || undefined,
    interviewSession.job?.title || interviewSession.title,
  );

  // Step 8: Save report and update session
  await prisma.interviewReport.upsert({
    where: { sessionId },
    update: {
      finalScore: sessionScores.finalScore,
      answerQualityScore: sessionScores.answerQualityScore,
      communicationScore: sessionScores.communicationScore,
      confidenceScore: sessionScores.confidenceScore,
      engagementScore: sessionScores.engagementScore,
      relevanceScore: sessionScores.relevanceScore,
      strengths: recruiterReport.strengths,
      weaknesses: recruiterReport.weaknesses,
      recruiterSummary: recruiterReport.recruiterSummary,
      hiringRecommendation: recruiterReport.hiringRecommendation,
      aiGeneratedInsights: recruiterReport.aiGeneratedInsights,
    },
    create: {
      sessionId,
      finalScore: sessionScores.finalScore,
      answerQualityScore: sessionScores.answerQualityScore,
      communicationScore: sessionScores.communicationScore,
      confidenceScore: sessionScores.confidenceScore,
      engagementScore: sessionScores.engagementScore,
      relevanceScore: sessionScores.relevanceScore,
      strengths: recruiterReport.strengths,
      weaknesses: recruiterReport.weaknesses,
      recruiterSummary: recruiterReport.recruiterSummary,
      hiringRecommendation: recruiterReport.hiringRecommendation,
      aiGeneratedInsights: recruiterReport.aiGeneratedInsights,
    },
  });

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      overallScore: sessionScores.finalScore,
      completedAt: new Date(),
    },
  });

  console.log(`[Interview] Session ${sessionId} analysis complete. Score: ${sessionScores.finalScore}/100`);
}
