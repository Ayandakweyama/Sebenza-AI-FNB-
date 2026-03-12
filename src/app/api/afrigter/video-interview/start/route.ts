import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title = 'Practice Interview',
      type = 'behavioral',
      difficulty = 'intermediate',
      jobId,
      questionCount = 5,
      cvText = '',
      jobTitle: providedJobTitle = '',
      jobDescription: providedJobDescription = '',
    } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      include: { profile: true, skills: true, jobPreferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found. Please sync your profile first.' }, { status: 404 });
    }

    // Use provided job info, or fall back to DB job if jobId is given
    let jobDescription = providedJobDescription;
    let jobTitle = providedJobTitle;
    if (!jobDescription && jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (job) {
        jobDescription = job.description || '';
        jobTitle = jobTitle || job.title || '';
      }
    }

    // Generate interview questions via AI
    const questions = await generateInterviewQuestions({
      type,
      difficulty,
      questionCount: Math.min(questionCount, 10),
      userTitle: user.profile?.title || undefined,
      userSkills: user.skills.map(s => s.name),
      jobTitle: jobTitle || title,
      jobDescription,
      cvText,
    });

    // Create session with questions in DB
    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        jobId: jobId || null,
        title,
        type,
        difficulty,
        status: 'pending',
        questions: {
          create: questions.map((q, i) => ({
            questionText: q.text,
            category: q.category,
            order: i,
            timeLimitSecs: q.timeLimitSecs || 120,
          })),
        },
      },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json({
      success: true,
      session: interviewSession,
    });
  } catch (error) {
    console.error('[Interview API] Start error:', error);
    return NextResponse.json({ error: 'Failed to start interview session' }, { status: 500 });
  }
}

// ─── Generate Questions via AI ──────────────────────────────────────────────

interface GenerateQuestionsParams {
  type: string;
  difficulty: string;
  questionCount: number;
  userTitle?: string;
  userSkills: string[];
  jobTitle: string;
  jobDescription: string;
  cvText: string;
}

interface GeneratedQuestion {
  text: string;
  category: string;
  timeLimitSecs: number;
}

async function generateInterviewQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
  const openai = getOpenAI();

  const prompt = `You are an expert interviewer. Generate ${params.questionCount} interview questions.

TYPE: ${params.type}
DIFFICULTY: ${params.difficulty}
${params.jobTitle ? `JOB TITLE: ${params.jobTitle}` : ''}
${params.userTitle ? `CANDIDATE'S CURRENT ROLE: ${params.userTitle}` : ''}
${params.userSkills.length ? `CANDIDATE SKILLS: ${params.userSkills.join(', ')}` : ''}
${params.jobDescription ? `JOB DESCRIPTION:
${params.jobDescription.substring(0, 2000)}` : ''}
${params.cvText ? `CANDIDATE CV / RESUME:
${params.cvText.substring(0, 2000)}` : ''}

Generate interview questions that are specifically tailored to:
- The job description requirements (if provided)
- The candidate's CV experience and skills (if provided)
- Ask about specific projects, technologies, or experiences mentioned in the CV
- Test whether the candidate meets the key requirements from the job description

Each question should be realistic and commonly asked in professional interviews.

Respond in JSON format ONLY:
{
  "questions": [
    { "text": "<question>", "category": "<behavioral|technical|situational|motivational>", "timeLimitSecs": 120 }
  ]
}

For behavioral questions, use the STAR format prompt (e.g., "Tell me about a time when...").
For technical questions, ask about specific knowledge or problem-solving.
For situational questions, present hypothetical scenarios.
Set timeLimitSecs to 90 for short questions, 120 for standard, 180 for complex.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const questions: GeneratedQuestion[] = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (questions.length === 0) {
      return getDefaultQuestions(params.questionCount);
    }

    return questions.map(q => ({
      text: q.text || 'Tell me about yourself.',
      category: q.category || 'behavioral',
      timeLimitSecs: q.timeLimitSecs || 120,
    }));
  } catch (error) {
    console.error('[Interview API] Question generation error:', error);
    return getDefaultQuestions(params.questionCount);
  }
}

function getDefaultQuestions(count: number): GeneratedQuestion[] {
  const defaults: GeneratedQuestion[] = [
    { text: 'Tell me about yourself and your professional background.', category: 'behavioral', timeLimitSecs: 120 },
    { text: 'What is your greatest professional achievement?', category: 'behavioral', timeLimitSecs: 120 },
    { text: 'Describe a challenging situation at work and how you handled it.', category: 'situational', timeLimitSecs: 150 },
    { text: 'Why are you interested in this role?', category: 'motivational', timeLimitSecs: 90 },
    { text: 'Where do you see yourself in five years?', category: 'motivational', timeLimitSecs: 90 },
    { text: 'Tell me about a time you worked effectively in a team.', category: 'behavioral', timeLimitSecs: 120 },
    { text: 'How do you handle pressure and tight deadlines?', category: 'situational', timeLimitSecs: 120 },
    { text: 'What are your strengths and weaknesses?', category: 'behavioral', timeLimitSecs: 120 },
    { text: 'Describe a time when you had to learn something new quickly.', category: 'behavioral', timeLimitSecs: 120 },
    { text: 'Do you have any questions for us?', category: 'motivational', timeLimitSecs: 90 },
  ];
  return defaults.slice(0, count);
}
