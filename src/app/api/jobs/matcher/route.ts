import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { extractSkillsFromCV, parseCV } from '@/lib/cvParser';
import { jobAIService } from '@/lib/ai/jobService';

type JobInput = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  source?: string;
};

const inflight = new Map<string, Promise<any>>();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const uniqueNonEmpty = (values: string[]) =>
  Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));

const extractKeywords = (text: string) => {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'about', 'as', 'from', 'into', 'over', 'under',
    'this', 'that', 'these', 'those', 'you', 'your', 'we', 'our', 'they', 'their', 'i', 'me', 'my',
    'will', 'can', 'must', 'should', 'may'
  ]);

  const clean = (text || '')
    .replace(/[^\w\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  return uniqueNonEmpty(clean);
};

const matchTerms = (text: string, terms: string[]) => {
  const found: string[] = [];
  for (const t of terms) {
    const re = new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i');
    if (re.test(text)) found.push(t);
  }
  return uniqueNonEmpty(found);
};

const scoreByTerms = (jobText: string, candidateTerms: string[]) => {
  const jobTerms = extractKeywords(jobText).slice(0, 40);
  if (!jobTerms.length || !candidateTerms.length) {
    return { score: 0, matched: [], missing: jobTerms.slice(0, 15) };
  }

  const matched = matchTerms(jobText, candidateTerms);
  const missing = jobTerms.filter((t) => !matched.includes(t)).slice(0, 15);
  const denom = Math.max(1, jobTerms.length);
  const score = Math.min(100, Math.round((matched.length / denom) * 100));
  return { score, matched, missing };
};

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const cvText = (body?.cvText || '').toString();
    const jobs = (body?.jobs || []) as JobInput[];
    const maxJobs = Math.min(30, Number(body?.maxJobs || 20));

    if (!cvText.trim()) return NextResponse.json({ error: 'cvText is required' }, { status: 400 });
    if (!Array.isArray(jobs) || jobs.length === 0) return NextResponse.json({ error: 'jobs are required' }, { status: 400 });

    const cacheKey = `${user.id}:${cvText.length}:${jobs.length}:${maxJobs}`;
    const existing = inflight.get(cacheKey);
    if (existing) {
      const result = await existing;
      return NextResponse.json(result);
    }

    const promise = (async () => {
      const parsed = parseCV(cvText);
      const extractedSkills = uniqueNonEmpty([...extractSkillsFromCV(cvText), ...(parsed.skills || [])]);
      const candidateKeywords = extractKeywords(cvText).slice(0, 60);
      const candidateTerms = (extractedSkills.length >= 5 ? extractedSkills : candidateKeywords).slice(0, 60);

      const experienceText = (parsed.experience || [])
        .map((e) => [e.position, e.company, e.duration, e.description].filter(Boolean).join(' - '))
        .filter(Boolean)
        .join('\n');

      const ranked = jobs
        .map((job) => {
          const haystack = `${job.title}\n${job.company}\n${job.description || ''}`;
          const scored = scoreByTerms(haystack, candidateTerms);
          return {
            job,
            heuristicScore: scored.score,
            matchedTerms: scored.matched,
            missingTerms: scored.missing
          };
        })
        .sort((a, b) => b.heuristicScore - a.heuristicScore)
        .slice(0, maxJobs);

      const topForAi = ranked.slice(0, 8);

      const withAi = await Promise.all(
        topForAi.map(async (item) => {
          const jobDescription = item.job.description || item.job.title;
          let ai:
            | {
                matchScore: number;
                missingSkills: string[];
                strengthAreas: string[];
                improvementSuggestions: string;
              }
            | null = null;

          try {
            ai = await jobAIService.matchSkillsToJob(
              jobDescription,
              candidateTerms.slice(0, 30),
              experienceText.slice(0, 2000)
            );
          } catch {
            ai = null;
          }

          const score = Math.min(100, Math.max(0, Math.round((ai?.matchScore || item.heuristicScore) ?? item.heuristicScore)));
          return {
            ...item.job,
            score,
            matches: ai?.strengthAreas?.length ? ai.strengthAreas : item.matchedTerms,
            missing: ai?.missingSkills?.length ? ai.missingSkills : item.missingTerms,
            explanation: ai?.improvementSuggestions || ''
          };
        })
      );

      const tail = ranked.slice(topForAi.length).map((item) => ({
        ...item.job,
        score: item.heuristicScore,
        matches: item.matchedTerms,
        missing: item.missingTerms,
        explanation: ''
      }));

      const results = [...withAi, ...tail].sort((a, b) => b.score - a.score);

      return { results };
    })();

    inflight.set(cacheKey, promise);
    try {
      const result = await promise;
      return NextResponse.json(result);
    } finally {
      inflight.delete(cacheKey);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to match jobs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
