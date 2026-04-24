import type { Job, ScraperConfig, ScraperResult } from './types';

// Fetch jobs via Adzuna API (most reliable - aggregates Indeed + other SA job boards)
// Requires ADZUNA_APP_ID and ADZUNA_APP_KEY env vars (free at https://developer.adzuna.com)
async function fetchAdzunaJobs(query: string, location: string, maxPages: number): Promise<{ jobs: Job[]; error?: string }> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return { jobs: [], error: 'Adzuna credentials not configured' };
  }

  const allJobs: Job[] = [];
  const resultsPerPage = 20;

  for (let page = 1; page <= Math.min(maxPages, 3); page++) {
    const url = `https://api.adzuna.com/v1/api/jobs/za/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&content-type=application/json`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`   ⚠️ Adzuna HTTP ${response.status} on page ${page}`);
        if (page === 1) return { jobs: [], error: `Adzuna API returned ${response.status}` };
        break;
      }

      const data = await response.json();
      const results = data.results || [];
      console.log(`   ✓ Adzuna page ${page}: ${results.length} jobs`);

      for (const job of results) {
        try {
          const salaryMin = job.salary_min;
          const salaryMax = job.salary_max;
          let salary = 'Not specified';
          if (salaryMin && salaryMax) {
            salary = `R${Math.round(salaryMin).toLocaleString()} - R${Math.round(salaryMax).toLocaleString()}`;
          } else if (salaryMin) {
            salary = `From R${Math.round(salaryMin).toLocaleString()}`;
          }

          const postedDate = job.created ? new Date(job.created).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

          allJobs.push({
            title: job.title || 'Untitled',
            company: job.company?.display_name || 'Company not specified',
            location: job.location?.display_name || location,
            salary,
            postedDate,
            description: (job.description || '').substring(0, 300),
            url: job.redirect_url || '',
            jobType: job.contract_type || job.contract_time || 'Full-time',
            industry: job.category?.label,
            source: 'indeed' as const,
          });
        } catch (e) { /* skip malformed */ }
      }

      if (results.length < resultsPerPage) break;
    } catch (err) {
      console.warn(`   ⚠️ Adzuna fetch failed: ${(err as Error).message}`);
      if (page === 1) return { jobs: [], error: (err as Error).message };
      break;
    }
  }

  return { jobs: allJobs };
}

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

  console.log(`🔍 Starting Indeed scraper for "${query}" in "${location}"`);

  try {
    // === STRATEGY 1: Adzuna API (most reliable, aggregates Indeed jobs) ===
    console.log(`   📡 Trying Adzuna API (aggregates Indeed + SA job boards)`);
    const adzunaResult = await fetchAdzunaJobs(query, location, maxPages);
    if (adzunaResult.jobs.length > 0) {
      const totalTime = Date.now() - startTime;
      console.log(`🎉 Indeed (via Adzuna) completed in ${totalTime}ms - Total jobs: ${adzunaResult.jobs.length}`);
      diagnostics.browserType = 'adzuna-api';
      diagnostics.actualUrl = 'https://api.adzuna.com/v1/api/jobs/za/search';
      diagnostics.pageTitle = 'Adzuna API';
      diagnostics.hasBlock = false;
      diagnostics.hasCaptcha = false;
      diagnostics.hasMosaic = true;
      diagnostics.loadTimeMs = totalTime;
      return {
        jobs: adzunaResult.jobs,
        success: true,
        source: 'indeed',
        count: adzunaResult.jobs.length,
        diagnostics,
      };
    } else if (adzunaResult.error) {
      console.warn(`   ⚠️ Adzuna skipped: ${adzunaResult.error}`);
      diagnostics.error = `Adzuna: ${adzunaResult.error}`;
    }

    // === STRATEGY 2: Indeed RSS feed fallback ===
    console.log(`   📡 Falling back to Indeed RSS feeds`);
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
