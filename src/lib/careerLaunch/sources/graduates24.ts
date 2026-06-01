import type { CareerOpportunity, OpportunityType } from '../types';
import { inferCareerField, parseClosingDateLoose, parsePostedDateLoose, stableIdFromUrl, stripTags } from '../utils';

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
  if (u.startsWith('/')) return `https://www.graduates24.com${u}`;
  return `https://www.graduates24.com/${u.replace(/^\.?\//, '')}`;
}

function extractBetween(haystack: string, startIndex: number, endIndex: number) {
  const a = Math.max(0, startIndex);
  const b = Math.max(a, endIndex);
  return haystack.slice(a, b);
}

function parseListingHtml(listingHtml: string, typeHint: OpportunityType, limit: number) {
  const out: CareerOpportunity[] = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>\s*Read More\s*<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(listingHtml)) && out.length < limit) {
    const title = stripTags(m[1] || '');
    const url = normalizeUrl(m[2] || '');
    if (!title || !url) continue;

    const block = extractBetween(listingHtml, m.index, re.lastIndex);
    const blockText = stripTags(block);
    const closingDate = parseClosingDateLoose(blockText);
    const postedDate = parsePostedDateLoose(blockText);
    const locationMatch =
      blockText.match(/([A-Za-z][A-Za-z\s]+,\s*South Africa)/i)?.[1] ||
      blockText.match(/(South Africa)/i)?.[1] ||
      null;

    out.push({
      id: stableIdFromUrl(url),
      title,
      url,
      source: 'graduates24',
      type: typeHint,
      careerField: inferCareerField(`${title} ${blockText}`),
      location: locationMatch ? String(locationMatch).trim() : null,
      postedDate,
      closingDate,
      openingDate: null,
      snippet: blockText ? blockText.slice(0, 240) : null,
    });
  }

  return out;
}

export async function scrapeGraduates24(type: OpportunityType, limit: number) {
  const url =
    type === 'Internship'
      ? 'https://www.graduates24.com/internshipprogrammes'
      : type === 'Graduate Programme'
        ? 'https://www.graduates24.com/graduate_programmes'
        : type === 'Learnership'
          ? 'https://www.graduates24.com/learnerships'
          : type === 'Bursary'
            ? 'https://www.graduates24.com/bursaries'
            : 'https://www.graduates24.com/entry_level_jobs';

  const html = await fetchHtml(url);
  return parseListingHtml(html, type, limit);
}
