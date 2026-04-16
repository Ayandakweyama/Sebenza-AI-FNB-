import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, FAST_BROWSER_CONFIG, fastDelay, getBrowserFromPool, returnBrowserToPool } from './utils';

// Parse job results from Indeed's mosaic provider data
function parseMosaicResults(results: any[]): Job[] {
  const jobs: Job[] = [];
  for (const job of results) {
    try {
      const title = job.title || job.displayTitle || '';
      const company = job.company || job.truncatedCompany || '';
      if (!title || !company) continue;

      const loc = job.formattedLocation || '';
      const salary = job.salarySnippet?.salaryTextFormatted?.text ||
                     (typeof job.salarySnippet?.salaryTextFormatted === 'string' ? job.salarySnippet.salaryTextFormatted : 'Not specified');
      const postedDate = job.formattedRelativeTime || 'Recently';
      const description = job.snippet ? job.snippet.replace(/<[^>]*>/g, '').trim() : '';
      const jobkey = job.jobkey || '';
      const url = jobkey ? `https://za.indeed.com/viewjob?jk=${jobkey}` : '';

      let jobType = 'Full-time';
      if (job.jobTypes && job.jobTypes.length > 0) {
        const t = job.jobTypes.join(' ').toLowerCase();
        if (t.includes('part-time')) jobType = 'Part-time';
        else if (t.includes('contract')) jobType = 'Contract';
        else if (t.includes('temporary')) jobType = 'Temporary';
      }

      jobs.push({ title, company, location: loc, salary: typeof salary === 'string' ? salary : 'Not specified', postedDate, description, url, jobType, source: 'indeed' as const });
    } catch (e) { /* skip */ }
  }
  return jobs;
}

// Extract mosaic JSON from raw HTML using balanced-brace matching (handles nested JSON)
function extractMosaicJsonFromHtml(html: string): any | null {
  const marker = 'window.mosaic.providerData["mosaic-provider-jobcards"]=';
  const idx = html.indexOf(marker);
  if (idx === -1) return null;

  const jsonStart = idx + marker.length;
  if (html[jsonStart] !== '{') return null;

  // Find the matching closing brace by counting depth
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i + 1; break; }
    }
  }
  if (jsonEnd === -1) return null;

  try {
    return JSON.parse(html.substring(jsonStart, jsonEnd));
  } catch (e) {
    console.warn('⚠️ Failed to parse mosaic JSON from HTML:', (e as Error).message);
    return null;
  }
}

export async function scrapeIndeed(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 3 } = config;
  let browser;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Starting Indeed scraper for "${query}" in "${location}"`);
    
    browser = await getBrowserFromPool();
    console.log(`⏱️ Browser acquired in ${Date.now() - startTime}ms`);
    
    const page = await browser.newPage();
    console.log(`⏱️ Page created in ${Date.now() - startTime}ms`);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await configureRequestInterception(page, false);
    console.log(`⏱️ Request interception configured in ${Date.now() - startTime}ms`);
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const start = pageNum * 10;
      const searchUrl = `https://za.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`;
      
      console.log(`📄 Indeed - Processing page ${pageNum + 1}/${maxPages}`);
      console.log(`   URL: ${searchUrl}`);
      
      try {
        const pageStartTime = Date.now();
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        console.log(`   ✓ Page loaded in ${Date.now() - pageStartTime}ms`);
        // Wait for network to settle after domcontentloaded
        await fastDelay(2000, 3000);
      } catch (navError) {
        console.error(`   ✗ Navigation failed:`, navError);
        // Don't throw - try to continue with whatever loaded
        continue;
      }
      
      // Wait for mosaic data to be available in the page
      try {
        await page.waitForFunction(
          () => !!(window as any).mosaic?.providerData?.["mosaic-provider-jobcards"],
          { timeout: 15000 }
        );
        console.log(`   ✓ Mosaic data available`);
      } catch (waitError) {
        console.warn(`   ⚠️ Mosaic data not found on window, will try HTML extraction`);
      }

      // Small delay + scroll to ensure all data is loaded
      await fastDelay(1000, 2000);
      await autoScroll(page);
      
      const extractStartTime = Date.now();
      let pageJobs: Job[] = [];

      // === METHOD 1: Extract from window.mosaic.providerData (client-side JS) ===
      try {
        pageJobs = await page.evaluate((): Job[] => {
          const mosaicProviderData = (window as any).mosaic?.providerData;
          if (!mosaicProviderData) return [];
          const jobCardsProvider = mosaicProviderData["mosaic-provider-jobcards"];
          if (!jobCardsProvider?.metaData?.mosaicProviderJobCardsModel?.results) return [];
          const results = jobCardsProvider.metaData.mosaicProviderJobCardsModel.results;
          const extracted: Job[] = [];
          for (const job of results) {
            try {
              const title = job.title || job.displayTitle || '';
              const company = job.company || job.truncatedCompany || '';
              if (!title || !company) continue;
              const loc = job.formattedLocation || '';
              const salary = job.salarySnippet?.salaryTextFormatted?.text ||
                             (typeof job.salarySnippet?.salaryTextFormatted === 'string' ? job.salarySnippet.salaryTextFormatted : 'Not specified');
              const postedDate = job.formattedRelativeTime || 'Recently';
              const description = job.snippet ? job.snippet.replace(/<[^>]*>/g, '').trim() : '';
              const jobkey = job.jobkey || '';
              const url = jobkey ? `https://za.indeed.com/viewjob?jk=${jobkey}` : '';
              let jobType = 'Full-time';
              if (job.jobTypes && job.jobTypes.length > 0) {
                const t = job.jobTypes.join(' ').toLowerCase();
                if (t.includes('part-time')) jobType = 'Part-time';
                else if (t.includes('contract')) jobType = 'Contract';
                else if (t.includes('temporary')) jobType = 'Temporary';
              }
              extracted.push({ title, company, location: loc, salary: typeof salary === 'string' ? salary : 'Not specified', postedDate, description, url, jobType, source: 'indeed' as const });
            } catch (e) { /* skip */ }
          }
          return extracted;
        });
        if (pageJobs.length > 0) {
          console.log(`   ✓ Method 1 (window.mosaic): ${pageJobs.length} jobs`);
        }
      } catch (e) {
        console.warn(`   ⚠️ Method 1 failed:`, (e as Error).message);
      }

      // === METHOD 2: Extract from raw HTML (server-side, more reliable) ===
      if (pageJobs.length === 0) {
        try {
          const html = await page.content();
          const mosaicData = extractMosaicJsonFromHtml(html);
          if (mosaicData?.metaData?.mosaicProviderJobCardsModel?.results) {
            pageJobs = parseMosaicResults(mosaicData.metaData.mosaicProviderJobCardsModel.results);
            console.log(`   ✓ Method 2 (HTML extraction): ${pageJobs.length} jobs`);
          } else {
            console.log(`   ⚠️ Method 2: mosaic JSON not found in HTML`);
          }
        } catch (e) {
          console.warn(`   ⚠️ Method 2 failed:`, (e as Error).message);
        }
      }

      // === METHOD 3: CSS selector fallback ===
      if (pageJobs.length === 0) {
        try {
          pageJobs = await page.evaluate((): Job[] => {
            const extracted: Job[] = [];
            const jobElements = document.querySelectorAll('div.job_seen_beacon, div.jobsearch-SerpJobCard, div[data-jk], div.slider_container div.slider_item, table.jobsTable tr, li.css-5q9pi9, div.css-1kv8g8i, div.cardOutline, div.result');
            jobElements.forEach((element) => {
              try {
                const titleElement = element.querySelector('h2.jobTitle a, h2.jobTitle span, a[data-jk] span[title], h2 a span[title], .jobTitle a, h2 a, a[data-jk]');
                const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
                const companyElement = element.querySelector('span[data-testid="company-name"], span.companyName, a[data-testid="company-name"], .companyName a, span.css-1x7z9ps');
                const company = companyElement?.textContent?.trim() || '';
                const locationElement = element.querySelector('div[data-testid="text-location"], div.companyLocation, .companyLocation, div.css-1v15gqr');
                const loc = locationElement?.textContent?.trim() || '';
                const salaryElement = element.querySelector('div.salary-snippet, div[data-testid="attribute_snippet_testid"], .salaryText, span.salaryText, span.css-1ih8o30');
                const salary = salaryElement?.textContent?.trim() || 'Not specified';
                const dateElement = element.querySelector('span.date, span[data-testid="myJobsStateDate"], .date, span.css-1cvi9m2');
                const postedDate = dateElement?.textContent?.trim() || 'Recently';
                const snippetElement = element.querySelector('div.job-snippet, div[class*="snippet"], .summary, div.jobsearch-jobDescriptionText');
                const description = snippetElement?.textContent?.trim() || '';
                const linkElement = element.querySelector('a[data-jk], h2.jobTitle a, .jobTitle a, a[href*="/viewjob"], a[id^="job_"]');
                const href = linkElement?.getAttribute('href') || '';
                const url = href.startsWith('http') ? href : `https://za.indeed.com${href}`;
                if (title && company) {
                  extracted.push({ title, company, location: loc, salary, postedDate, description, url, jobType: 'Full-time', source: 'indeed' as const });
                }
              } catch (e) { /* skip */ }
            });
            return extracted;
          });
          if (pageJobs.length > 0) {
            console.log(`   ✓ Method 3 (CSS selectors): ${pageJobs.length} jobs`);
          }
        } catch (e) {
          console.warn(`   ⚠️ Method 3 failed:`, (e as Error).message);
        }
      }

      console.log(`✅ Indeed - Found ${pageJobs.length} jobs on page ${pageNum + 1} (extraction took ${Date.now() - extractStartTime}ms)`);
      allJobs.push(...pageJobs);
      
      if (pageNum < maxPages - 1) {
        await fastDelay(2000, 4000);
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Indeed scraper completed in ${totalTime}ms - Total jobs: ${allJobs.length}`);
    
    return {
      jobs: allJobs,
      success: true,
      source: 'indeed',
      count: allJobs.length
    };
    
  } catch (error) {
    console.error('❌ Indeed scraper error:', error);
    return {
      jobs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'indeed',
      count: 0
    };
  } finally {
    if (browser) {
      try {
        await returnBrowserToPool(browser);
        console.log('✓ Indeed browser returned to pool');
      } catch (closeError) {
        console.warn('⚠️ Error closing Indeed browser:', closeError);
      }
    }
  }
}
