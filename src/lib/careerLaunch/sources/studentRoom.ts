import type { CareerOpportunity, OpportunityType } from '../types';
import { inferCareerField, inferOpportunityType, parseClosingDateLoose, stableIdFromUrl, stripTags } from '../utils';

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SebenzaAI/1.0' },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function normalizeUrl(url: string) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/')) return `https://www.studentroom.co.za${u}`;
  return `https://www.studentroom.co.za/${u.replace(/^\.?\//, '')}`;
}

function pageForType(type: OpportunityType) {
  if (type === 'Bursary') return 'https://www.studentroom.co.za/category/bursaries/';
  if (type === 'Learnership') return 'https://www.studentroom.co.za/category/learnership/';
  if (type === 'Entry-Level Job') return 'https://www.studentroom.co.za/category/latest-opportunity/';
  return 'https://www.studentroom.co.za/category/internships/';
}

function parsePosts(html: string, limit: number) {
  const out: CareerOpportunity[] = [];
  const re = /<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < limit) {
    const url = normalizeUrl(m[1] || '');
    const title = stripTags(m[2] || '');
    if (!url || !title) continue;

    const block = html.slice(Math.max(0, m.index), Math.min(html.length, re.lastIndex + 1600));
    const blockText = stripTags(block);
    const closingDate = parseClosingDateLoose(blockText);

    const postedDateMatch = block.match(/<time[^>]*datetime="([^"]+)"[^>]*>/i)?.[1] || null;
    const postedDate = postedDateMatch ? new Date(postedDateMatch).toISOString() : null;

    const location =
      blockText.match(/\bLocation:\s*([^.\n]+)\b/i)?.[1] ||
      blockText.match(/\bInternship Location:\s*([^.\n]+)\b/i)?.[1] ||
      blockText.match(/\bProgramme Location:\s*([^.\n]+)\b/i)?.[1] ||
      blockText.match(/\bBursary Location:\s*([^.\n]+)\b/i)?.[1] ||
      null;

    out.push({
      id: stableIdFromUrl(url),
      title,
      url,
      source: 'studentroom',
      type: inferOpportunityType(title, url),
      careerField: inferCareerField(`${title} ${blockText}`),
      location: location ? String(location).trim() : null,
      postedDate,
      closingDate,
      openingDate: null,
      snippet: blockText ? blockText.slice(0, 240) : null,
    });
  }
  return out;
}

export async function scrapeStudentRoom(type: OpportunityType, limit: number) {
  const html = await fetchHtml(pageForType(type));
  const parsed = parsePosts(html, limit);
  return parsed.map((it) => ({ ...it, type }));
}

