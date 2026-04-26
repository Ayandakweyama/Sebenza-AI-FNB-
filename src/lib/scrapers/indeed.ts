import type { Job, ScraperConfig, ScraperResult } from './types';
import { getBrowserFromPool, returnBrowserToPool, autoScroll, configureRequestInterception, fastDelay } from './utils';

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

    if (xmlData) {
      const rssJobs = parseIndeedRss(xmlData, location);
      if (rssJobs.length > 0) {
        const totalTime = Date.now() - startTime;
        console.log(`🎉 Indeed RSS scraper completed in ${totalTime}ms - Total jobs: ${rssJobs.length} from ${successUrl}`);
        diagnostics.loadTimeMs = totalTime;
        diagnostics.hasMosaic = true;
        return { jobs: rssJobs, success: true, source: 'indeed', count: rssJobs.length, diagnostics };
      }
    }

    // === STRATEGY 3: SA job boards via Puppeteer (CareerJunction, Careers24) ===
    console.log(`   🤖 Falling back to SA job board Puppeteer scrapers`);

    const saSites = [
      {
        name: 'CareerJunction',
        url: `https://www.careerjunction.co.za/jobs?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&pagesize=20&page=1`,
        baseUrl: 'https://www.careerjunction.co.za',
        source: 'careerjunction' as const,
        cardSel: 'article.job, div.job-item, div[data-job-id], div.result-item, li.job-result',
        titleSel: 'h2 a, h3 a, a.job-title, .job-title a, a[data-job-title]',
        companySel: '.company, .company-name, span.employer, div.employer-name',
        locationSel: '.location, .job-location, span.location, div.job-location',
        salarySel: '.salary, .remuneration, span.salary, div.salary-range',
        descSel: '.description, .job-description, .snippet, div.job-snippet',
        linkSel: 'a.job-title, h2 a, h3 a, a[href*="/jobs/"]',
      },
      {
        name: 'Careers24',
        url: `https://www.careers24.com/jobs/results?quicksearch=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=1`,
        baseUrl: 'https://www.careers24.com',
        source: 'careers24' as const,
        cardSel: 'article.job, div.listing, div.job-card, div.vacancy',
        titleSel: 'h2 a, h3 a, a.title, .job-title a',
        companySel: '.company, .company-name, .advertiser',
        locationSel: '.location, .area, .region',
        salarySel: '.salary, .package, .remuneration',
        descSel: '.description, .summary, .snippet',
        linkSel: 'a.title, h2 a, h3 a, a[href*="/job/"]',
      },
    ];

    let sasBrowser;
    try {
      sasBrowser = await getBrowserFromPool();
      const page = await sasBrowser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await configureRequestInterception(page, false); // Non-aggressive: don't block stylesheets (needed for CJ React SPA)

      for (const site of saSites) {
        try {
          console.log(`   📄 ${site.name} URL: ${site.url}`);
          await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          const siteTitle = await page.title();
          console.log(`   📝 ${site.name} title: ${siteTitle}`);

          const blocked = siteTitle.toLowerCase().includes('just a moment') ||
            siteTitle.toLowerCase().includes('cloudflare') ||
            siteTitle.toLowerCase().includes('not found') ||
            siteTitle.toLowerCase().includes('error') ||
            siteTitle.toLowerCase().includes('403') ||
            siteTitle.toLowerCase().includes('access denied');

          if (blocked) {
            console.warn(`   ⚠️ ${site.name} blocked/404: "${siteTitle}"`);
            continue;
          }

          // Wait for job cards to render (CJ uses JS rendering)
          try {
            await page.waitForSelector(site.cardSel, { timeout: 8000 });
          } catch { /* cards may not appear — try anyway */ }

          // Dismiss cookie consent if present
          try {
            const cookieBtn = await page.$('#cookie-consent-accept-all, button[data-testid="cookie-banner-accept-all"], button[id*="cookie"], button[class*="cookie-accept"], .cc-accept, #accept-cookies');
            if (cookieBtn) { await cookieBtn.click(); await fastDelay(500, 800); }
          } catch { /* ignore */ }

          await fastDelay(1000, 1800);
          await autoScroll(page);

          // Debug: log what card selectors are matching on this page
          const selectorCounts = await page.evaluate((cardSel: string) => {
            const counts: Record<string, number> = {};
            cardSel.split(',').map(s => s.trim()).forEach(sel => {
              try { counts[sel] = document.querySelectorAll(sel).length; } catch { counts[sel] = -1; }
            });
            counts['_total_elements'] = document.querySelectorAll('*').length;
            return counts;
          }, site.cardSel);
          console.log(`   🔍 ${site.name} selector counts:`, JSON.stringify(selectorCounts));

          const siteJobs = await page.evaluate((
            loc: string, baseUrl: string, siteSrc: string,
            cardSel: string, titleSel: string, companySel: string,
            locationSel: string, salarySel: string, descSel: string,
            linkSel: string
          ): Job[] => {
            const results: Job[] = [];
            const seen = new Set<string>();

            const isJobUrl = (href: string): boolean => {
              const clean = href.replace(/\?.*$/, '').replace(/\/$/, '');
              const segs = clean.split('/').filter(Boolean);
              if (segs.length < 2) return false;
              const last = segs[segs.length - 1];
              const prev = segs[segs.length - 2] || '';
              return /\d{4,}/.test(last) || /\d{4,}/.test(prev);
            };

            // Primary: extract from structured job cards (trust card structure, no URL filtering)
            document.querySelectorAll(cardSel).forEach((card) => {
              try {
                const linkEl = card.querySelector(linkSel) as HTMLAnchorElement | null;
                const href = linkEl?.getAttribute('href') || '';
                if (!href || href === '#') return;
                const url = href.startsWith('http') ? href : `${baseUrl}${href}`;

                const titleEl = card.querySelector(titleSel) || card.querySelector('h2, h3, h4');
                const title = titleEl?.textContent?.trim() || linkEl?.textContent?.trim() || '';
                if (!title || title.length < 4 || seen.has(title)) return;
                seen.add(title);

                const company = card.querySelector(companySel)?.textContent?.trim() || '';
                const jobLoc = card.querySelector(locationSel)?.textContent?.trim() || loc;
                const salary = card.querySelector(salarySel)?.textContent?.trim() || 'Not specified';
                const description = card.querySelector(descSel)?.textContent?.trim()?.substring(0, 300) || '';
                const date = card.querySelector('.date, time, [class*="date"], [class*="posted"]')?.textContent?.trim() || 'Recently';
                const jobType = card.querySelector('[class*="type"], [class*="employment"]')?.textContent?.trim() || 'Full-time';

                results.push({
                  title, company: company || 'See job details', location: jobLoc,
                  salary, postedDate: date, description, url, jobType,
                  source: siteSrc as any,
                });
              } catch (e) { /* skip */ }
            });

            // Fallback: collect individual job links only (filter out nav/category links)
            if (results.length === 0) {
              document.querySelectorAll(linkSel).forEach((el) => {
                const link = el as HTMLAnchorElement;
                const href = link.getAttribute('href') || '';
                if (!href || !isJobUrl(href)) return;
                const title = link.textContent?.trim() || link.getAttribute('title') || '';
                if (!title || title.length < 4 || seen.has(title)) return;
                seen.add(title);
                const url = href.startsWith('http') ? href : `${baseUrl}${href}`;
                // Try to get company from parent context
                const parent = link.closest('article, li, div[class*="job"], div[class*="result"]');
                const company = parent?.querySelector(companySel)?.textContent?.trim() || '';
                const jobLoc = parent?.querySelector(locationSel)?.textContent?.trim() || loc;
                const description = parent?.querySelector(descSel)?.textContent?.trim()?.substring(0, 300) || '';
                results.push({
                  title, company: company || 'See job details', location: jobLoc,
                  salary: 'Not specified', postedDate: 'Recently', description,
                  url, jobType: 'Full-time', source: siteSrc as any,
                });
              });
            }

            return results;
          }, location, site.baseUrl, site.source,
            site.cardSel, site.titleSel, site.companySel,
            site.locationSel, site.salarySel, site.descSel,
            site.linkSel);

          console.log(`   ✅ ${site.name} jobs found: ${siteJobs.length}`);
          if (siteJobs.length > 0) {
            const totalTime = Date.now() - startTime;
            diagnostics.browserType = `puppeteer-${site.name.toLowerCase()}`;
            diagnostics.actualUrl = site.url;
            diagnostics.pageTitle = siteTitle;
            diagnostics.loadTimeMs = totalTime;
            diagnostics.hasMosaic = true;
            diagnostics.hasBlock = false;
            return { jobs: siteJobs, success: true, source: 'indeed', count: siteJobs.length, diagnostics };
          }
        } catch (siteErr) {
          console.warn(`   ⚠️ ${site.name} failed: ${(siteErr as Error).message}`);
        }
      }
    } catch (sasErr) {
      console.warn(`   ⚠️ SA job board browser error: ${(sasErr as Error).message}`);
    } finally {
      if (sasBrowser) {
        try { await returnBrowserToPool(sasBrowser); } catch (e) { /* ignore */ }
      }
    }

    // All strategies exhausted
    console.error('❌ All Indeed strategies failed (Adzuna: no keys, RSS: 403, SA boards: no results)');
    diagnostics.error = 'All strategies failed: add ADZUNA_APP_ID + ADZUNA_APP_KEY to Railway env vars';
    diagnostics.hasBlock = true;
    const totalTime = Date.now() - startTime;
    diagnostics.loadTimeMs = totalTime;
    return { jobs: [], success: false, error: 'All job sources unavailable', source: 'indeed', count: 0, diagnostics };

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
