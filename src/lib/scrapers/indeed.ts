import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, FAST_BROWSER_CONFIG, fastDelay, getBrowserFromPool, returnBrowserToPool } from './utils';

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
          waitUntil: 'networkidle2',
          timeout: 60000 
        });
        console.log(`   ✓ Page loaded in ${Date.now() - pageStartTime}ms`);
      } catch (navError) {
        console.error(`   ✗ Navigation failed:`, navError);
        throw navError;
      }
      
      const scrollStartTime = Date.now();
      await fastDelay(2000, 3000);
      await autoScroll(page);
      console.log(`   ✓ Auto-scroll completed in ${Date.now() - scrollStartTime}ms`);
      
      const extractStartTime = Date.now();
      
      // Primary method: Extract from Indeed's embedded JSON data
      // Indeed stores job data in window.mosaic.providerData["mosaic-provider-jobcards"]
      const jsonJobs = await page.evaluate((): Job[] => {
        const extractedJobs: Job[] = [];
        
        try {
          // Method 1: Extract from window.mosaic.providerData
          const mosaicProviderData = (window as any).mosaic?.providerData;
          if (mosaicProviderData) {
            const jobCardsProvider = mosaicProviderData["mosaic-provider-jobcards"];
            if (jobCardsProvider?.metaData?.mosaicProviderJobCardsModel?.results) {
              const results = jobCardsProvider.metaData.mosaicProviderJobCardsModel.results;
              
              for (const job of results) {
                try {
                  const title = job.title || job.displayTitle || '';
                  const company = job.company || job.truncatedCompany || '';
                  const loc = job.formattedLocation || '';
                  const salary = job.salarySnippet?.salaryTextFormatted?.text || 
                                 job.salarySnippet?.salaryTextFormatted || 'Not specified';
                  const postedDate = job.formattedRelativeTime || 'Recently';
                  const description = job.snippet ? job.snippet.replace(/<[^>]*>/g, '').trim() : '';
                  const jobkey = job.jobkey || '';
                  const url = jobkey ? `https://za.indeed.com/viewjob?jk=${jobkey}` : '';
                  
                  // Determine job type from taxonomyAttributes
                  let jobType = 'Full-time';
                  if (job.jobTypes && job.jobTypes.length > 0) {
                    const typesStr = job.jobTypes.join(' ').toLowerCase();
                    if (typesStr.includes('part-time')) jobType = 'Part-time';
                    else if (typesStr.includes('contract')) jobType = 'Contract';
                    else if (typesStr.includes('temporary')) jobType = 'Temporary';
                  }
                  if (job.taxonomyAttributes) {
                    for (const attr of job.taxonomyAttributes) {
                      if (attr.label === 'job-types' && attr.attributes) {
                        for (const sub of attr.attributes) {
                          const label = (sub.label || '').toLowerCase();
                          if (label.includes('part-time')) jobType = 'Part-time';
                          else if (label.includes('contract')) jobType = 'Contract';
                          else if (label.includes('temporary')) jobType = 'Temporary';
                        }
                      }
                    }
                  }
                  
                  if (title && company) {
                    extractedJobs.push({
                      title,
                      company,
                      location: loc,
                      salary: typeof salary === 'string' ? salary : 'Not specified',
                      postedDate,
                      description,
                      url,
                      jobType,
                      source: 'indeed' as const
                    });
                  }
                } catch (e) {
                  // Skip this job
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error extracting from mosaic provider data:', e);
        }
        
        // Method 2: Try _initialData if mosaic didn't work
        if (extractedJobs.length === 0) {
          try {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
              const content = script.textContent || '';
              if (content.includes('window.mosaic.providerData')) {
                const match = content.match(/window\.mosaic\.providerData\["mosaic-provider-jobcards"\]=(\{.+?\});/);
                if (match) {
                  const data = JSON.parse(match[1]);
                  const results = data?.metaData?.mosaicProviderJobCardsModel?.results || [];
                  for (const job of results) {
                    try {
                      const title = job.title || job.displayTitle || '';
                      const company = job.company || job.truncatedCompany || '';
                      if (title && company) {
                        extractedJobs.push({
                          title,
                          company,
                          location: job.formattedLocation || '',
                          salary: typeof job.salarySnippet?.salaryTextFormatted === 'string' 
                            ? job.salarySnippet.salaryTextFormatted : 'Not specified',
                          postedDate: job.formattedRelativeTime || 'Recently',
                          description: job.snippet ? job.snippet.replace(/<[^>]*>/g, '').trim() : '',
                          url: job.jobkey ? `https://za.indeed.com/viewjob?jk=${job.jobkey}` : '',
                          jobType: 'Full-time',
                          source: 'indeed' as const
                        });
                      }
                    } catch (e2) {
                      // Skip
                    }
                  }
                  break;
                }
              }
            }
          } catch (e) {
            console.warn('Error extracting from script tags:', e);
          }
        }
        
        // Method 3: Fallback to CSS selectors if JSON methods failed
        if (extractedJobs.length === 0) {
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
                extractedJobs.push({
                  title,
                  company,
                  location: loc,
                  salary,
                  postedDate,
                  description,
                  url,
                  jobType: 'Full-time',
                  source: 'indeed' as const
                });
              }
            } catch (error) {
              // Skip
            }
          });
        }
        
        return extractedJobs;
      });
      
      console.log(`✅ Indeed - Found ${jsonJobs.length} jobs on page ${pageNum + 1} (extraction took ${Date.now() - extractStartTime}ms)`);
      allJobs.push(...jsonJobs);
      
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
