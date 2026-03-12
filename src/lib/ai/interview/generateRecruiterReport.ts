import OpenAI from 'openai';
import type { SessionScores } from './scoreInterview';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RecruiterReport {
  strengths: string[];
  weaknesses: string[];
  recruiterSummary: string;
  hiringRecommendation: 'proceed' | 'maybe' | 'reject';
  aiGeneratedInsights: {
    overallImpression: string;
    communicationStyle: string;
    technicalDepth: string;
    cultureFitIndicators: string;
    riskFactors: string[];
  };
}

// ─── OpenAI Client ───────────────────────────────────────────────────────────

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Generate Recruiter Report ──────────────────────────────────────────────

export async function generateRecruiterReport(
  sessionScores: SessionScores,
  questionsAndTranscripts: Array<{ question: string; transcript: string; feedback: string }>,
  candidateName?: string,
  jobTitle?: string,
): Promise<RecruiterReport> {
  const openai = getOpenAI();

  const qaSection = questionsAndTranscripts
    .map((qa, i) => `Q${i + 1}: "${qa.question}"\nAnswer: "${qa.transcript.substring(0, 500)}"\nAI Feedback: ${qa.feedback}`)
    .join('\n\n');

  const prompt = `You are a senior recruiter writing an interview assessment report.

CANDIDATE: ${candidateName || 'Candidate'}
${jobTitle ? `POSITION: ${jobTitle}` : ''}

INTERVIEW SCORES:
- Overall Score: ${sessionScores.finalScore}/100
- Answer Quality: ${sessionScores.answerQualityScore}/100 (40% weight)
- Communication: ${sessionScores.communicationScore}/100 (20% weight)
- Confidence: ${sessionScores.confidenceScore}/100 (15% weight)
- Engagement: ${sessionScores.engagementScore}/100 (15% weight)
- Relevance: ${sessionScores.relevanceScore}/100 (10% weight)

QUESTIONS AND ANSWERS:
${qaSection}

Based on this data, produce a recruiter assessment report.

Respond in JSON format ONLY:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recruiterSummary": "<2-3 paragraph professional assessment>",
  "hiringRecommendation": "<proceed|maybe|reject>",
  "aiGeneratedInsights": {
    "overallImpression": "<brief overall impression>",
    "communicationStyle": "<assessment of communication style>",
    "technicalDepth": "<assessment of technical/subject knowledge shown>",
    "cultureFitIndicators": "<observations about cultural fit>",
    "riskFactors": ["risk1", "risk2"]
  }
}

Guidelines:
- Be professional and balanced
- Strengths and weaknesses should be specific, not generic
- Hiring recommendation: "proceed" if score >= 70, "maybe" if 50-69, "reject" if < 50
- The recruiter summary should be something a hiring manager can read and act on`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    const recommendation = parsed.hiringRecommendation;
    const validRecs = ['proceed', 'maybe', 'reject'] as const;

    return {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recruiterSummary: parsed.recruiterSummary || '',
      hiringRecommendation: validRecs.includes(recommendation) ? recommendation : 'maybe',
      aiGeneratedInsights: {
        overallImpression: parsed.aiGeneratedInsights?.overallImpression || '',
        communicationStyle: parsed.aiGeneratedInsights?.communicationStyle || '',
        technicalDepth: parsed.aiGeneratedInsights?.technicalDepth || '',
        cultureFitIndicators: parsed.aiGeneratedInsights?.cultureFitIndicators || '',
        riskFactors: Array.isArray(parsed.aiGeneratedInsights?.riskFactors)
          ? parsed.aiGeneratedInsights.riskFactors
          : [],
      },
    };
  } catch (error) {
    console.error('[Interview AI] Report generation error:', error);
    return {
      strengths: [],
      weaknesses: [],
      recruiterSummary: 'Report generation failed. Please try again.',
      hiringRecommendation: 'maybe',
      aiGeneratedInsights: {
        overallImpression: '',
        communicationStyle: '',
        technicalDepth: '',
        cultureFitIndicators: '',
        riskFactors: [],
      },
    };
  }
}
