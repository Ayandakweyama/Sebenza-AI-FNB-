import type { Job, ScraperConfig, ScraperResult } from './types';

// Parse Indeed RSS XML into Job objects
function parseIndeedRss(xml: string, defaultLocation: string): Job[] {
  const jobs: Job[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    try {
      const item = match[1];
      const getTag = (tag: string): string => {
        const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return (m ? (m[1] || m[2] || '') : '').trim();
      };
      const title = getTag('title');
      const url = getTag('link') || getTag('guid');
      const description = getTag('description').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      const pubDate = getTag('pubDate');

      // Indeed RSS encodes company and location in the description or source tag
      const sourceTag = getTag('source');
      const company = sourceTag || '';

      // Try to extract location from description (Indeed often puts it in there)
      const locMatch = description.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*(?:South Africa|Gauteng|Western Cape|KwaZulu-Natal|Eastern Cape|Limpopo|Mpumalanga|North West|Northern Cape|Free State)/);
      const location = locMatch ? locMatch[0] : defaultLocation;

      const postedDate = pubDate ? new Date(pubDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

      const descLower = description.toLowerCase();
      let jobType = 'Full-time';
      if (descLower.includes('part-time') || descLower.includes('part time')) jobType = 'Part-time';
      else if (descLower.includes('contract')) jobType = 'Contract';
      else if (descLower.includes('temporary') || descLower.includes('temp ')) jobType = 'Temporary';

      if (title && url) {
        jobs.push({ title, company, location, salary: 'Not specified', postedDate, description: description.substring(0, 300), url, jobType, source: 'indeed' as const });
      }
    } catch (e) { /* skip malformed item */ }
  }
  return jobs;
}

export async function scrapeIndeed(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 3 } = config;
  const startTime = Date.now();
  const allJobs: Job[] = [];
  const diagnostics: import('./types').ScraperDiagnostics = { browserType: 'rss-fetch' };

  // Indeed RSS feed - bypasses Cloudflare bot protection that blocks Puppeteer on Railway US servers
  // RSS feeds are served without bot protection and work from any server location
  const rssUrls = [
    `https://za.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=date`,
    `https://www.indeed.com/rss?q=${encodeURIComponent(query)}+${encodeURIComponent(location)}&l=South+Africa&sort=date`,
    `https://rss.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=date`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'en-ZA,en;q=0.9',
    'Cache-Control': 'no-cache',
  };

  console.log(`🔍 Starting Indeed RSS scraper for "${query}" in "${location}"`);

  try {
    let xmlData = '';
    let successUrl = '';

    for (const rssUrl of rssUrls) {
      console.log(`   📡 Trying RSS: ${rssUrl}`);
      diagnostics.url = rssUrl;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(rssUrl, { headers, signal: controller.signal });
        clearTimeout(timeout);
        console.log(`   📊 HTTP ${response.status} from ${rssUrl}`);
        if (response.ok) {
          const text = await response.text();
          if (text.includes('<item>') || text.includes('<?xml')) {
            xmlData = text;
            successUrl = rssUrl;
            diagnostics.actualUrl = rssUrl;
            diagnostics.pageTitle = 'RSS feed';
            diagnostics.hasBlock = false;
            diagnostics.hasCaptcha = false;
            console.log(`   ✅ RSS feed OK, length: ${text.length}`);
            break;
          } else {
            console.warn(`   ⚠️ RSS response not XML (title check): ${text.substring(0, 200)}`);
            diagnostics.htmlPreview = text.substring(0, 200);
          }
        } else {
          console.warn(`   ⚠️ RSS HTTP ${response.status}`);
        }
      } catch (fetchErr) {
        console.warn(`   ⚠️ RSS fetch failed: ${(fetchErr as Error).message}`);
      }
    }

    if (!xmlData) {
      console.error('❌ All Indeed RSS URLs failed');
      diagnostics.error = 'All RSS URLs returned no valid XML';
      diagnostics.hasBlock = true;
      return { jobs: [], success: false, error: 'Indeed RSS unavailable', source: 'indeed', count: 0, diagnostics };
    }

    const jobs = parseIndeedRss(xmlData, location);
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Indeed RSS scraper completed in ${totalTime}ms - Total jobs: ${jobs.length} from ${successUrl}`);
    diagnostics.loadTimeMs = totalTime;
    diagnostics.hasMosaic = jobs.length > 0;

    return {
      jobs,
      success: true,
      source: 'indeed',
      count: jobs.length,
      diagnostics
    };

  } catch (error) {
    console.error('❌ Indeed scraper error:', error);
    diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
    return {
      jobs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'indeed',
      count: 0,
      diagnostics
    };
  }
}
