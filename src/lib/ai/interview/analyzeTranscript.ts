import OpenAI from 'openai';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TranscriptAnalysis {
  clarityScore: number;       // 0–100
  relevanceScore: number;     // 0–100
  communicationScore: number; // 0–100
  keywordsMatched: string[];
  feedback: string;
  detailedAnalysis: {
    answerStructure: string;
    contentDepth: string;
    grammarAndArticulation: string;
    improvementSuggestions: string[];
  };
}

// ─── OpenAI Client ───────────────────────────────────────────────────────────

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Analyze Transcript ─────────────────────────────────────────────────────

export async function analyzeTranscript(
  transcript: string,
  questionText: string,
  jobDescription?: string,
  userSkills?: string[],
): Promise<TranscriptAnalysis> {
  const openai = getOpenAI();

  const prompt = `You are an expert interview coach and recruiter. Analyze this interview answer transcript.

INTERVIEW QUESTION:
"${questionText}"

CANDIDATE'S ANSWER (transcript):
"${transcript}"

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.substring(0, 2000)}` : ''}
${userSkills?.length ? `CANDIDATE SKILLS: ${userSkills.join(', ')}` : ''}

Evaluate the answer on these dimensions:
1. **Clarity** (0–100): How clear, structured, and easy to follow is the answer?
2. **Relevance** (0–100): How well does the answer address the question and relate to the job?
3. **Communication** (0–100): Grammar, articulation, use of professional language, conciseness.

Also identify:
- Keywords from the job description that were mentioned
- A brief overall feedback paragraph
- Detailed analysis of answer structure, content depth, grammar
- 2–4 specific improvement suggestions

Respond in JSON format ONLY:
{
  "clarityScore": <number 0-100>,
  "relevanceScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "keywordsMatched": ["keyword1", "keyword2"],
  "feedback": "<brief overall feedback>",
  "detailedAnalysis": {
    "answerStructure": "<analysis of how well-structured the answer is>",
    "contentDepth": "<analysis of depth and substance>",
    "grammarAndArticulation": "<analysis of language quality>",
    "improvementSuggestions": ["suggestion1", "suggestion2"]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      clarityScore: clamp(parsed.clarityScore ?? 50, 0, 100),
      relevanceScore: clamp(parsed.relevanceScore ?? 50, 0, 100),
      communicationScore: clamp(parsed.communicationScore ?? 50, 0, 100),
      keywordsMatched: Array.isArray(parsed.keywordsMatched) ? parsed.keywordsMatched : [],
      feedback: parsed.feedback || 'Analysis could not generate detailed feedback.',
      detailedAnalysis: {
        answerStructure: parsed.detailedAnalysis?.answerStructure || '',
        contentDepth: parsed.detailedAnalysis?.contentDepth || '',
        grammarAndArticulation: parsed.detailedAnalysis?.grammarAndArticulation || '',
        improvementSuggestions: Array.isArray(parsed.detailedAnalysis?.improvementSuggestions)
          ? parsed.detailedAnalysis.improvementSuggestions
          : [],
      },
    };
  } catch (error) {
    console.error('[Interview AI] Transcript analysis error:', error);
    return {
      clarityScore: 0,
      relevanceScore: 0,
      communicationScore: 0,
      keywordsMatched: [],
      feedback: 'Analysis failed. Please try again.',
      detailedAnalysis: {
        answerStructure: '',
        contentDepth: '',
        grammarAndArticulation: '',
        improvementSuggestions: [],
      },
    };
  }
}

// ─── Transcribe Audio via Whisper ────────────────────────────────────────────

export async function transcribeAudio(audioBuffer: Buffer, fileName: string): Promise<string> {
  const openai = getOpenAI();

  try {
    const file = new File([audioBuffer], fileName, { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    return typeof transcription === 'string' ? transcription : String(transcription);
  } catch (error) {
    console.error('[Interview AI] Whisper transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
