import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';
import type { CareerOpportunity, OpportunityType } from '@/lib/careerLaunch/types';
import { dedupeOpportunities, inferCareerField, inferOpportunityType } from '@/lib/careerLaunch/utils';
import { scrapeGraduates24 } from '@/lib/careerLaunch/sources/graduates24';
import { scrapeGraduateEmployers } from '@/lib/careerLaunch/sources/graduateEmployers';
import { scrapeViaRssDiscovery } from '@/lib/careerLaunch/sources/rssDiscovery';
import { scrapeLimpopo24 } from '@/lib/careerLaunch/sources/limpopo24';
import { scrapeStudentRoom } from '@/lib/careerLaunch/sources/studentRoom';

const DEFAULT_LIMIT_PER_TYPE = 10;

export async function POST(req: NextRequest) {
  const rate = await rateLimiters.scraping.check(req);
  if (!rate.success) return rateLimitResponse(rate.message);

  try {
    const body = (await req.json().catch(() => null)) as
      | {
          limitPerType?: number;
          includeSources?: Array<'graduates24' | 'prosple' | 'studentroom' | 'limpopo24' | 'employers-of-choice'>;
          types?: OpportunityType[];
        }
      | null;

    const limitPerType = Math.max(3, Math.min(25, Number(body?.limitPerType || DEFAULT_LIMIT_PER_TYPE)));
    const includeSources = new Set(body?.includeSources || ['graduates24', 'employers-of-choice', 'studentroom', 'prosple', 'limpopo24']);
    const types: OpportunityType[] = Array.isArray(body?.types) && body?.types.length
      ? (body?.types as OpportunityType[])
      : ['Graduate Programme', 'Internship', 'Learnership', 'Bursary', 'Entry-Level Job'];

    const gradsPromises = includeSources.has('graduates24')
      ? types.map((t) => scrapeGraduates24(t, limitPerType).catch(() => []))
      : [];

    const employersPromise = includeSources.has('employers-of-choice')
      ? scrapeGraduateEmployers(Math.min(50, limitPerType * 4)).catch(() => [])
      : Promise.resolve([] as CareerOpportunity[]);

    const studentRoomPromises = includeSources.has('studentroom')
      ? types.map((t) => scrapeStudentRoom(t, Math.min(16, limitPerType)).catch(() => []))
      : [];

    const limpopo24Promises = includeSources.has('limpopo24')
      ? types.map((t) => scrapeLimpopo24(t, Math.min(16, limitPerType)).catch(() => []))
      : [];

    const rssPromises: Array<Promise<CareerOpportunity[]>> = [];
    if (includeSources.has('prosple')) {
      rssPromises.push(
        scrapeViaRssDiscovery('prosple', {
          query: 'site:za.prosple.com (jobs-internships) (internship OR learnership OR bursary OR graduate)',
          limit: 14,
          fetchDetails: true,
        }).catch(() => [])
      );
    }
    if (includeSources.has('studentroom')) {
      rssPromises.push(
        scrapeViaRssDiscovery('studentroom', {
          query: 'site:studentroom.co.za (internship OR learnership OR bursary OR graduate programme OR entry-level)',
          limit: 14,
          fetchDetails: false,
        }).catch(() => [])
      );
    }
    if (includeSources.has('limpopo24')) {
      rssPromises.push(
        scrapeViaRssDiscovery('limpopo24', {
          query: 'site:limpopo24 (internship OR learnership OR bursary OR graduate)',
          limit: 10,
          fetchDetails: false,
        }).catch(() => [])
      );
    }

    const grads = (await Promise.all(gradsPromises)).flat();
    const employers = await employersPromise;
    const studentroomDirect = (await Promise.all(studentRoomPromises)).flat();
    const limpopo24Direct = (await Promise.all(limpopo24Promises)).flat();
    const rss = (await Promise.all(rssPromises)).flat();

    const all = dedupeOpportunities([...grads, ...studentroomDirect, ...limpopo24Direct, ...employers, ...rss]).map((it) => ({
      ...it,
      type: it.type || inferOpportunityType(it.title, it.url),
      careerField: it.careerField ?? inferCareerField(`${it.title} ${it.snippet || ''} ${it.url}`),
    }));

    const filtered = all.filter((it) => types.includes(it.type));

    return NextResponse.json({
      items: filtered.slice(0, 120),
      meta: {
        total: filtered.length,
        sources: Array.from(includeSources),
      },
    });
  } catch (e) {
    return NextResponse.json({ items: [], error: e instanceof Error ? e.message : 'Failed to scrape' }, { status: 200 });
  }
}
