import type { CareerOpportunity, OpportunitySource, OpportunityType } from '../types';
import { dedupeOpportunities, inferCareerField, inferOpportunityType, parseClosingDateLoose, stableIdFromUrl, stripTags } from '../utils';

function decodeXml(s: string) {
  return s
    .replaceAll('<![CDATA[', '')
    .replaceAll(']]>', '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function extractTag(block: string, tag: string) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? decodeXml(m[1].trim()) : null;
}

async function fetchRss(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SebenzaAI/1.0' },
    next: { revalidate: 600 },
  });
  if (!res.ok) return '';
  return await res.text();
}

function pickSourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function typeForSource(source: OpportunitySource, title: string, url: string): OpportunityType {
  if (source === 'graduates24') return inferOpportunityType(title, url);
  return inferOpportunityType(title, url);
}

async function fetchMeta(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SebenzaAI/1.0' },
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const title =
    html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i)?.[1] ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    null;
  const text = stripTags(html);
  const closingDate = parseClosingDateLoose(text);
  const location =
    text.match(/\bLocation\s+([A-Za-z][A-Za-z\s]+)\b/i)?.[1] ||
    text.match(/\b(Gauteng|Western Cape|Eastern Cape|KwaZulu-Natal|Free State|Limpopo|Mpumalanga|Northern Cape|North West)\b/i)?.[1] ||
    null;
  return {
    title: title ? decodeXml(String(title)) : null,
    closingDate,
    location: location ? String(location).trim() : null,
  };
}

export async function scrapeViaRssDiscovery(source: OpportunitySource, opts: { query: string; limit: number; fetchDetails?: boolean }) {
  const q = encodeURIComponent(opts.query);
  const feed = `https://news.google.com/rss/search?q=${q}&hl=en-ZA&gl=ZA&ceid=ZA:en`;
  const xml = await fetchRss(feed);
  const items = xml.match(/<item[\s\S]*?>[\s\S]*?<\/item>/gi) ?? [];
  const out: CareerOpportunity[] = [];

  for (const item of items.slice(0, Math.max(0, opts.limit))) {
    const title = extractTag(item, 'title');
    const link = extractTag(item, 'link');
    if (!title || !link) continue;

    const host = pickSourceHost(link);
    if (source === 'prosple' && !/(^|\.)prosple\.com$/.test(host) && !/(^|\.)za\.prosple\.com$/.test(host)) continue;
    if (source === 'studentroom' && !/(^|\.)studentroom\.co\.za$/.test(host)) continue;
    if (source === 'limpopo24' && !/(^|\.)limpopo24\.co\.za$/.test(host) && !/(^|\.)limpopo24\.com$/.test(host)) continue;
    if (source === 'employers-of-choice' && !/(employers|graduate)/i.test(link)) continue;

    const base: CareerOpportunity = {
      id: stableIdFromUrl(link),
      title,
      url: link,
      source,
      type: typeForSource(source, title, link),
      careerField: inferCareerField(`${title} ${link}`),
      location: null,
      postedDate: null,
      closingDate: null,
      openingDate: null,
      snippet: null,
    };

    out.push(base);
  }

  if (!opts.fetchDetails) return dedupeOpportunities(out);

  const enriched: CareerOpportunity[] = [];
  for (const it of out) {
    try {
      const meta = await fetchMeta(it.url);
      enriched.push({
        ...it,
        title: meta?.title || it.title,
        closingDate: meta?.closingDate || it.closingDate,
        location: meta?.location || it.location,
        careerField: inferCareerField(`${meta?.title || it.title} ${it.url}`) || it.careerField,
      });
    } catch {
      enriched.push(it);
    }
  }

  return dedupeOpportunities(enriched);
}
