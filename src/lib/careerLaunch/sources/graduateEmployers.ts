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
  if (u.startsWith('/')) return `https://graduateemployers.co.za${u}`;
  return `https://graduateemployers.co.za/${u.replace(/^\.?\//, '')}`;
}

function parseTypeFromBlock(blockText: string): OpportunityType {
  const t = blockText.toLowerCase();
  if (t.includes('bursaries')) return 'Bursary';
  if (t.includes('learnership')) return 'Learnership';
  if (t.includes('internship')) return 'Internship';
  if (t.includes('graduate programme') || t.includes('graduate program')) return 'Graduate Programme';
  if (t.includes('entry level') || t.includes('entry-level')) return 'Entry-Level Job';
  return inferOpportunityType(blockText);
}

export async function scrapeGraduateEmployers(limit: number) {
  const html = await fetchHtml('https://graduateemployers.co.za/career-opportunities/');
  const out: CareerOpportunity[] = [];

  const re = /<a[^>]*href="([^"]*\/opportunity\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < limit) {
    const url = normalizeUrl(m[1] || '');
    const title = stripTags(m[2] || '');
    if (!url || !title) continue;

    const block = html.slice(Math.max(0, m.index), Math.min(html.length, re.lastIndex + 1200));
    const blockText = stripTags(block);
    const closingDate = parseClosingDateLoose(blockText);
    const location =
      blockText.match(/\b([A-Za-z][A-Za-z\s-]+,\s*South Africa)\b/i)?.[1] ||
      blockText.match(/\b(South Africa)\b/i)?.[1] ||
      null;

    const type = parseTypeFromBlock(blockText);

    out.push({
      id: stableIdFromUrl(url),
      title,
      url,
      source: 'employers-of-choice',
      type,
      careerField: inferCareerField(`${title} ${blockText}`),
      location: location ? String(location).trim() : null,
      postedDate: null,
      closingDate,
      openingDate: null,
      snippet: blockText ? blockText.slice(0, 240) : null,
    });
  }

  const map = new Map<string, CareerOpportunity>();
  for (const it of out) {
    if (!map.has(it.url)) map.set(it.url, it);
  }
  return Array.from(map.values());
}

