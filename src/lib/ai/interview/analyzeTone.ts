import OpenAI from 'openai';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToneAnalysis {
  confidenceScore: number; // 0–100
  emotionScore: number;    // 0–100
  dominantEmotion: string;
  toneAttributes: {
    pace: string;       // slow, moderate, fast
    energy: string;     // low, moderate, high
    hesitation: string; // none, minor, frequent
    filler_words: string[];
  };
  feedback: string;
}

// ─── OpenAI Client ───────────────────────────────────────────────────────────

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Analyze Tone from Transcript ───────────────────────────────────────────
// Since we cannot run OpenSMILE in a Next.js API route, we use a pragmatic
// approach: analyze the transcript text for vocal indicators (filler words,
// sentence structure, hesitation markers) and infer confidence/emotion.
// For a production system, this would be replaced by a dedicated audio
// analysis microservice using OpenSMILE or similar.

export async function analyzeTone(transcript: string): Promise<ToneAnalysis> {
  const openai = getOpenAI();

  const prompt = `You are an expert speech coach and communication analyst.

Analyze this interview transcript for vocal and communication tone qualities.
Infer confidence, emotional state, and speaking patterns from the text.

TRANSCRIPT:
"${transcript.substring(0, 3000)}"

Evaluate:
1. **Confidence Score** (0–100): Based on assertive language, directness, hedging, qualifiers.
2. **Emotion Score** (0–100): How positive/composed is the overall emotional tone? 100 = very positive and composed, 0 = very negative/anxious.
3. **Dominant Emotion**: The primary emotion conveyed (confident, nervous, enthusiastic, neutral, anxious, calm).
4. **Pace**: slow, moderate, or fast (inferred from sentence length and complexity).
5. **Energy**: low, moderate, or high.
6. **Hesitation**: none, minor, or frequent (look for filler phrases, restarts, hedging).
7. **Filler Words**: List any filler words/phrases detected (um, uh, like, you know, basically, sort of).
8. **Feedback**: A brief coaching note on tone.

Respond in JSON format ONLY:
{
  "confidenceScore": <number 0-100>,
  "emotionScore": <number 0-100>,
  "dominantEmotion": "<string>",
  "toneAttributes": {
    "pace": "<slow|moderate|fast>",
    "energy": "<low|moderate|high>",
    "hesitation": "<none|minor|frequent>",
    "filler_words": ["word1", "word2"]
  },
  "feedback": "<brief coaching note>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      confidenceScore: clamp(parsed.confidenceScore ?? 50, 0, 100),
      emotionScore: clamp(parsed.emotionScore ?? 50, 0, 100),
      dominantEmotion: parsed.dominantEmotion || 'neutral',
      toneAttributes: {
        pace: parsed.toneAttributes?.pace || 'moderate',
        energy: parsed.toneAttributes?.energy || 'moderate',
        hesitation: parsed.toneAttributes?.hesitation || 'none',
        filler_words: Array.isArray(parsed.toneAttributes?.filler_words)
          ? parsed.toneAttributes.filler_words
          : [],
      },
      feedback: parsed.feedback || '',
    };
  } catch (error) {
    console.error('[Interview AI] Tone analysis error:', error);
    return {
      confidenceScore: 0,
      emotionScore: 0,
      dominantEmotion: 'unknown',
      toneAttributes: {
        pace: 'unknown',
        energy: 'unknown',
        hesitation: 'unknown',
        filler_words: [],
      },
      feedback: 'Tone analysis failed.',
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
