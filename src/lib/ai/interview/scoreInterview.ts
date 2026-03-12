import type { TranscriptAnalysis } from './analyzeTranscript';
import type { ToneAnalysis } from './analyzeTone';
import type { FacialAnalysis } from './analyzeFacialExpressions';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResponseScores {
  clarityScore: number;
  confidenceScore: number;
  relevanceScore: number;
  communicationScore: number;
  emotionScore: number;
  facialScore: number;
  aiFeedback: string;
  keywordsMatched: string[];
  detailedAnalysis: Record<string, unknown>;
}

export interface SessionScores {
  finalScore: number;
  answerQualityScore: number;
  communicationScore: number;
  confidenceScore: number;
  engagementScore: number;
  relevanceScore: number;
}

// ─── Scoring Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  answerQuality: 0.40,
  communication: 0.20,
  confidence: 0.15,
  engagement: 0.15,
  relevance: 0.10,
};

// ─── Score a Single Response ─────────────────────────────────────────────────
// Combines transcript, tone, and facial analysis into a single set of scores.

export function scoreResponse(
  transcript: TranscriptAnalysis,
  tone: ToneAnalysis,
  facial: FacialAnalysis,
): ResponseScores {
  const clarityScore = transcript.clarityScore;
  const relevanceScore = transcript.relevanceScore;
  const communicationScore = transcript.communicationScore;
  const confidenceScore = tone.confidenceScore;
  const emotionScore = tone.emotionScore;
  const facialScore = facial.facialScore;

  // Combine feedback from all sources
  const feedbackParts = [transcript.feedback];
  if (tone.feedback) feedbackParts.push(tone.feedback);
  if (facial.feedback) feedbackParts.push(facial.feedback);
  const aiFeedback = feedbackParts.join('\n\n');

  return {
    clarityScore,
    confidenceScore,
    relevanceScore,
    communicationScore,
    emotionScore,
    facialScore,
    aiFeedback,
    keywordsMatched: transcript.keywordsMatched,
    detailedAnalysis: {
      transcript: transcript.detailedAnalysis,
      tone: {
        dominantEmotion: tone.dominantEmotion,
        toneAttributes: tone.toneAttributes,
      },
      facial: {
        eyeContactScore: facial.eyeContactScore,
        engagementLevel: facial.engagementLevel,
      },
    },
  };
}

// ─── Score an Entire Session ─────────────────────────────────────────────────
// Averages individual response scores across all questions using the defined weights.

export function scoreSession(
  responseScores: ResponseScores[],
): SessionScores {
  if (responseScores.length === 0) {
    return {
      finalScore: 0,
      answerQualityScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      engagementScore: 0,
      relevanceScore: 0,
    };
  }

  const avg = (scores: number[]) =>
    Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Answer quality = average of clarity scores
  const answerQualityScore = avg(responseScores.map(r => r.clarityScore));
  const communicationScore = avg(responseScores.map(r => r.communicationScore));
  const confidenceScore = avg(responseScores.map(r => r.confidenceScore));
  const engagementScore = avg(responseScores.map(r => r.facialScore));
  const relevanceScore = avg(responseScores.map(r => r.relevanceScore));

  const finalScore = Math.round(
    answerQualityScore * WEIGHTS.answerQuality +
    communicationScore * WEIGHTS.communication +
    confidenceScore * WEIGHTS.confidence +
    engagementScore * WEIGHTS.engagement +
    relevanceScore * WEIGHTS.relevance
  );

  return {
    finalScore: clamp(finalScore, 0, 100),
    answerQualityScore,
    communicationScore,
    confidenceScore,
    engagementScore,
    relevanceScore,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
