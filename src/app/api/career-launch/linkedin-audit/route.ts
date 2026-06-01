import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

type AuditResult = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  quickFixes: string[];
  scraped: boolean;
};

let openaiSingleton: OpenAI | null = null;

function getOpenAIClient() {
  if (openaiSingleton) return openaiSingleton;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  openaiSingleton = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
  return openaiSingleton;
}

function stripTags(html: string) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function tryFetchPublicLinkedIn(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(6500),
    });
    if (!res.ok) return { ok: false as const, html: '' };
    const html = await res.text();
    const text = stripTags(html).toLowerCase();
    if (text.includes('sign in') && text.includes('linkedin')) return { ok: false as const, html: '' };
    if (text.includes('captcha') || text.includes('unusual activity')) return { ok: false as const, html: '' };
    return { ok: true as const, html };
  } catch {
    return { ok: false as const, html: '' };
  }
}

function heuristicAudit(profileText: string, scraped: boolean): AuditResult {
  const t = profileText.toLowerCase();
  let score = 35;

  const hasHeadline = /(headline|software engineer|developer|analyst|graduate|intern)/i.test(profileText);
  const aboutLen = profileText.length;
  const hasAbout = /(about|summary)/.test(t) || aboutLen > 400;
  const hasExperience = /(experience|employment|worked at|intern)/.test(t);
  const hasEducation = /(education|university|degree|diploma)/.test(t);
  const hasSkills = /(skills|javascript|python|sql|excel|power bi|react|node)/.test(t);
  const hasProjects = /(projects|portfolio|github)/.test(t);
  const hasMetrics = /(\b\d+%|\b\d+\s*(years|months)|\br\d+|\b\d+\s*(users|customers|clients|transactions))/.test(t);

  if (hasHeadline) score += 10;
  if (hasAbout) score += 10;
  if (aboutLen > 1200) score += 8;
  if (hasExperience) score += 12;
  if (hasEducation) score += 8;
  if (hasSkills) score += 8;
  if (hasProjects) score += 6;
  if (hasMetrics) score += 8;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const strengths: string[] = [];
  if (hasHeadline) strengths.push('Clear professional headline');
  if (hasExperience) strengths.push('Experience section present');
  if (hasEducation) strengths.push('Education section present');
  if (hasSkills) strengths.push('Skills keywords detected');
  if (hasMetrics) strengths.push('Impact/metrics detected');

  const improvements: string[] = [];
  if (!hasAbout) improvements.push('Add a strong About section (150–300 words) that matches your target role');
  if (!hasMetrics) improvements.push('Add measurable impact in experience bullets (numbers, outcomes, scope)');
  if (!hasProjects) improvements.push('Add a Projects/Featured section (GitHub, portfolio, case studies)');

  const quickFixes: string[] = [
    'Use a headline that includes your target role + niche + value (e.g., “Graduate Data Analyst | Power BI | SQL | Banking”)',
    'Add 10–20 relevant skills aligned to roles you are applying for',
    'Rewrite experience bullets using Action → Impact → Tools',
  ];

  return {
    score,
    summary: scraped
      ? 'LinkedIn URL was scraped successfully. Score is based on detected sections and signals.'
      : 'LinkedIn blocked public scraping. Score is based on the text you provided.',
    strengths: strengths.length ? strengths : ['Profile text received'],
    improvements: improvements.length ? improvements : ['Keep refining your profile for your target roles'],
    quickFixes,
    scraped,
  };
}

export async function POST(req: NextRequest) {
  const rate = await rateLimiters.ai.check(req);
  if (!rate.success) return rateLimitResponse(rate.message);

  try {
    const body = (await req.json().catch(() => null)) as { url?: string; pastedText?: string } | null;
    const url = String(body?.url || '').trim();
    const pastedText = String(body?.pastedText || '').trim();

    if (!url && !pastedText) {
      return NextResponse.json({ error: 'Provide a LinkedIn URL or paste your profile text.' }, { status: 400 });
    }

    let scraped = false;
    let profileText = pastedText;

    if (url) {
      const fetched = await tryFetchPublicLinkedIn(url);
      if (fetched.ok) {
        scraped = true;
        profileText = stripTags(fetched.html).slice(0, 18000);
      }
    }

    if (!profileText) {
      return NextResponse.json(
        { error: 'LinkedIn blocked scraping for this URL. Paste your profile text to continue.' },
        { status: 400 }
      );
    }

    try {
      const client = getOpenAIClient();
      const system = `You are a senior recruiter and LinkedIn profile coach. Return ONLY JSON.`;
      const user = `Score this LinkedIn profile for a graduate/entry-level candidate.\n\nPROFILE TEXT:\n${profileText}\n\nReturn JSON:\n{\n  \"score\": number(0-100),\n  \"summary\": string,\n  \"strengths\": string[],\n  \"improvements\": string[],\n  \"quickFixes\": string[]\n}\n\nBe strict but actionable.`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.35,
        max_tokens: 900,
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as Partial<AuditResult>;
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 0))));
      return NextResponse.json({
        score,
        summary: String(parsed.summary || ''),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 8) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 10) : [],
        quickFixes: Array.isArray(parsed.quickFixes) ? parsed.quickFixes.slice(0, 8) : [],
        scraped,
      } satisfies AuditResult);
    } catch {
      return NextResponse.json(heuristicAudit(profileText, scraped));
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to audit LinkedIn profile' }, { status: 500 });
  }
}
