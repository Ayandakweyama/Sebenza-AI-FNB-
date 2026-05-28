import { NextResponse } from 'next/server';

type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  topic: 'hiring' | 'unemployment' | 'economy' | 'policy' | 'general';
};

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

function pickSourceFromUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'news';
  }
}

function scoreSentiment(title: string) {
  const t = title.toLowerCase();
  const pos = ['hiring', 'growth', 'boom', 'increase', 'rises', 'surge', 'record', 'expands', 'investment', 'jobs added'];
  const neg = ['layoff', 'retrench', 'cuts', 'decline', 'falls', 'slump', 'recession', 'unemployment', 'job losses', 'strike'];
  let s = 0;
  for (const w of pos) if (t.includes(w)) s += 1;
  for (const w of neg) if (t.includes(w)) s -= 1;
  if (s >= 1) return 'positive' as const;
  if (s <= -1) return 'negative' as const;
  return 'neutral' as const;
}

function topicFromTitle(title: string): NewsItem['topic'] {
  const t = title.toLowerCase();
  if (t.includes('unemployment') || t.includes('job losses') || t.includes('retrench') || t.includes('layoff')) return 'unemployment';
  if (t.includes('interest rate') || t.includes('budget') || t.includes('policy') || t.includes('minister')) return 'policy';
  if (t.includes('gdp') || t.includes('inflation') || t.includes('economy') || t.includes('rand')) return 'economy';
  if (t.includes('hiring') || t.includes('vacancies') || t.includes('recruit')) return 'hiring';
  return 'general';
}

async function fetchRss(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SebenzaAI/1.0' },
    next: { revalidate: 600 },
  });
  if (!res.ok) return '';
  return await res.text();
}

function parseRss(xml: string): NewsItem[] {
  if (!xml) return [];
  const items = xml.match(/<item[\s\S]*?>[\s\S]*?<\/item>/gi) ?? [];
  const out: NewsItem[] = [];
  for (const item of items) {
    const title = extractTag(item, 'title');
    const link = extractTag(item, 'link');
    if (!title || !link) continue;
    const pubDate = extractTag(item, 'pubDate');
    out.push({
      title,
      url: link,
      source: pickSourceFromUrl(link),
      publishedAt: pubDate || null,
      sentiment: scoreSentiment(title),
      topic: topicFromTitle(title),
    });
  }
  return out;
}

export async function GET() {
  try {
    const feeds = [
      'https://news.google.com/rss/search?q=South%20Africa%20employment%20jobs%20hiring&hl=en-ZA&gl=ZA&ceid=ZA:en',
      'https://news.google.com/rss/search?q=South%20Africa%20unemployment%20retrenchments&hl=en-ZA&gl=ZA&ceid=ZA:en',
      'https://news.google.com/rss/search?q=South%20Africa%20interest%20rates%20inflation%20gdp&hl=en-ZA&gl=ZA&ceid=ZA:en',
    ];

    const xmls = await Promise.all(feeds.map((f) => fetchRss(f).catch(() => '')));
    const combined = xmls.flatMap(parseRss);

    const deduped = new Map<string, NewsItem>();
    for (const it of combined) {
      const key = it.url;
      if (!key) continue;
      if (!deduped.has(key)) deduped.set(key, it);
    }

    const items = Array.from(deduped.values())
      .sort((a, b) => {
        const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return bt - at;
      })
      .slice(0, 12);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

