import OpenAI from 'openai';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  title?: string;
  experience?: string;
  industry?: string;
  linkedinUrl?: string;
  skills: string[];
  desiredRoles: string[];
  cvText?: string;
}

export interface ApplicationQuestion {
  question: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  options?: string[];
  required?: boolean;
  fieldName?: string;
}

export interface AnsweredQuestion {
  question: string;
  answer: string;
  confidence: number;
  fieldName?: string;
}

export interface JobMatchResult {
  score: number;
  shouldApply: boolean;
  reason: string;
}

// ─── OpenAI Client ───────────────────────────────────────────────────────────

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Evaluate Job Match ──────────────────────────────────────────────────────

export async function evaluateJobMatch(
  profile: UserProfile,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<JobMatchResult> {
  try {
    const openai = getOpenAI();

    const prompt = `You are a career advisor AI. Evaluate how well this job matches the candidate's profile.

CANDIDATE PROFILE:
- Name: ${profile.name}
- Title: ${profile.title || 'Not specified'}
- Skills: ${profile.skills.join(', ') || 'Not specified'}
- Experience: ${profile.experience || 'Not specified'}
- Industry: ${profile.industry || 'Not specified'}
- Desired Roles: ${profile.desiredRoles.join(', ') || 'Not specified'}
- Location: ${profile.location || 'Not specified'}
${profile.cvText ? `- CV Summary: ${profile.cvText.substring(0, 1000)}` : ''}

JOB:
- Title: ${jobTitle}
- Company: ${company}
- Description: ${jobDescription.substring(0, 2000)}

Respond in JSON format ONLY:
{
  "score": <number 0-100>,
  "shouldApply": <boolean>,
  "reason": "<brief explanation>"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      score: Math.min(100, Math.max(0, result.score || 0)),
      shouldApply: result.shouldApply ?? result.score >= 50,
      reason: result.reason || 'No reason provided',
    };
  } catch (error) {
    console.error('[AutoApplyAI] Error evaluating job match:', error);
    return { score: 50, shouldApply: true, reason: 'Could not evaluate — applying by default' };
  }
}

// ─── Answer Application Questions ────────────────────────────────────────────

export async function answerApplicationQuestions(
  profile: UserProfile,
  jobTitle: string,
  company: string,
  jobDescription: string,
  questions: ApplicationQuestion[]
): Promise<AnsweredQuestion[]> {
  if (questions.length === 0) return [];

  try {
    const openai = getOpenAI();

    const questionsText = questions
      .map((q, i) => {
        let text = `${i + 1}. "${q.question}" (type: ${q.type}${q.required ? ', required' : ''})`;
        if (q.options?.length) text += `\n   Options: ${q.options.join(', ')}`;
        return text;
      })
      .join('\n');

    const prompt = `You are an AI assistant helping a job applicant fill out an application form on Indeed.

APPLICANT PROFILE:
- Name: ${profile.name}
- Email: ${profile.email}
- Phone: ${profile.phone || 'Not provided'}
- Location: ${profile.location || 'Not provided'}
- Title: ${profile.title || 'Not provided'}
- Skills: ${profile.skills.join(', ') || 'Not provided'}
- Experience: ${profile.experience || 'Not provided'}
- Industry: ${profile.industry || 'Not provided'}
- LinkedIn: ${profile.linkedinUrl || 'Not provided'}
${profile.bio ? `- Bio: ${profile.bio}` : ''}
${profile.cvText ? `- CV Summary: ${profile.cvText.substring(0, 1500)}` : ''}

JOB: ${jobTitle} at ${company}
${jobDescription ? `Description: ${jobDescription.substring(0, 1000)}` : ''}

APPLICATION QUESTIONS:
${questionsText}

INSTRUCTIONS:
- Answer each question professionally and truthfully based on the applicant's profile.
- For select/radio questions, choose the BEST matching option from the provided options.
- For yes/no questions, answer "Yes" if the applicant likely qualifies, otherwise "No".
- For number questions (years of experience, etc.), provide a reasonable number.
- For text questions, keep answers concise but complete.
- If you don't have enough info, make a reasonable professional guess.
- Set confidence 0.0-1.0 based on how sure you are.

Respond in JSON format ONLY as an array:
[
  { "questionIndex": 0, "answer": "...", "confidence": 0.9 },
  ...
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const answers: Array<{ questionIndex: number; answer: string; confidence: number }> =
      Array.isArray(parsed) ? parsed : parsed.answers || parsed.responses || [];

    return answers.map((a) => {
      const q = questions[a.questionIndex] || questions[0];
      return {
        question: q?.question || `Question ${a.questionIndex + 1}`,
        answer: String(a.answer || ''),
        confidence: Math.min(1, Math.max(0, a.confidence || 0.5)),
        fieldName: q?.fieldName,
      };
    });
  } catch (error) {
    console.error('[AutoApplyAI] Error answering questions:', error);
    return questions.map((q) => ({
      question: q.question,
      answer: '',
      confidence: 0,
      fieldName: q.fieldName,
    }));
  }
}

// ─── Generate Cover Letter ───────────────────────────────────────────────────

export async function generateCoverLetter(
  profile: UserProfile,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<string> {
  try {
    const openai = getOpenAI();

    const prompt = `Write a concise, professional cover letter for this job application.

APPLICANT: ${profile.name}
- Title: ${profile.title || 'Professional'}
- Skills: ${profile.skills.join(', ') || 'Various'}
- Experience: ${profile.experience || 'Experienced professional'}
${profile.bio ? `- About: ${profile.bio}` : ''}

JOB: ${jobTitle} at ${company}
${jobDescription ? `Description: ${jobDescription.substring(0, 1500)}` : ''}

Write a 3-paragraph cover letter. Be professional, specific, and enthusiastic. Do NOT include placeholder brackets.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[AutoApplyAI] Error generating cover letter:', error);
    return '';
  }
}
