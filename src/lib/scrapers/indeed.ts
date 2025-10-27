import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, FAST_BROWSER_CONFIG, fastDelay, getBrowserFromPool, returnBrowserToPool } from './utils';

export async function scrapeIndeed(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 3 } = config; // Increased default pages
  let browser;
  
  try {
    console.log(`🔍 Starting Indeed scraper for "${query}" in "${location}"`);
    
    browser = await getBrowserFromPool();
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await configureRequestInterception(page, true); // Aggressive blocking for speed
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const start = pageNum * 10;
      const searchUrl = `https://za.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`;
      
      console.log(`📄 Indeed - Processing page ${pageNum + 1}/${maxPages}`);
      console.log(`   URL: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',  // Changed from networkidle2
          timeout: 60000 
        });
        console.log('   ✓ Page loaded');
      } catch (navError) {
        console.error(`   ✗ Navigation failed:`, navError);
        throw navError;
      }
      
      await fastDelay(1000, 2000); // Faster delays
      await autoScroll(page);
      
      // Debug: Check what selectors are available
      const debugSelectors = await page.evaluate(() => {
        const selectors = {
          'div.job_seen_beacon': document.querySelectorAll('div.job_seen_beacon').length,
          'div.jobsearch-SerpJobCard': document.querySelectorAll('div.jobsearch-SerpJobCard').length,
          'div[data-jk]': document.querySelectorAll('div[data-jk]').length,
          'article': document.querySelectorAll('article').length,
          'div[class*="job"]': document.querySelectorAll('div[class*="job"]').length,
        };
        return selectors;
      });
      console.log(`📊 Indeed page ${pageNum + 1} - Available selectors:`, debugSelectors);
      
      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('div.job_seen_beacon, div.jobsearch-SerpJobCard, div[data-jk], div.slider_container div.slider_item, table.jobsTable tr');
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            // Enhanced title extraction with more selectors
            const titleElement = element.querySelector('h2.jobTitle a, h2.jobTitle span, a[data-jk] span[title], h2 a span[title], .jobTitle a');
            const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
            
            // Enhanced company extraction
            const companyElement = element.querySelector('span[data-testid="company-name"], span.companyName, a[data-testid="company-name"], .companyName a');
            const company = companyElement?.textContent?.trim() || '';
            
            // Enhanced location extraction
            const locationElement = element.querySelector('div[data-testid="text-location"], div.companyLocation, .companyLocation');
            const location = locationElement?.textContent?.trim() || '';
            
            // Enhanced salary extraction
            const salaryElement = element.querySelector('div.salary-snippet, div[data-testid="attribute_snippet_testid"], .salaryText, span.salaryText');
            const salary = salaryElement?.textContent?.trim() || 'Not specified';
            
            // Enhanced date extraction
            const dateElement = element.querySelector('span.date, span[data-testid="myJobsStateDate"], .date');
            const postedDate = dateElement?.textContent?.trim() || 'Recently';
            
            // Enhanced description extraction
            const snippetElement = element.querySelector('div.job-snippet, div[class*="snippet"], .summary, div.jobsearch-jobDescriptionText');
            const description = snippetElement?.textContent?.trim() || '';
            
            // Enhanced URL extraction
            const linkElement = element.querySelector('a[data-jk], h2.jobTitle a, .jobTitle a, a[href*="/viewjob"]');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://za.indeed.com${href}`;
            
            // Enhanced job type extraction
            const jobTypeElement = element.querySelector('div[data-testid="attribute_snippet_testid"], div.metadata, .jobTypeLabel');
            const jobTypeText = jobTypeElement?.textContent?.toLowerCase() || '';
            const jobType = jobTypeText.includes('full-time') ? 'Full-time' : 
                           jobTypeText.includes('part-time') ? 'Part-time' : 
                           jobTypeText.includes('contract') ? 'Contract' : 
                           jobTypeText.includes('temporary') ? 'Temporary' :
                           'Full-time';
            
            if (title && company) {
              extractedJobs.push({
                title,
                company,
                location,
                salary,
                postedDate,
                description,
                url,
                jobType,
                source: 'indeed' as const
              });
            }
          } catch (error) {
            console.warn('Error extracting job:', error);
          }
        });
        
        return extractedJobs;
      });
      
      console.log(`✅ Indeed - Found ${jobs.length} jobs on page ${pageNum + 1}`);
      allJobs.push(...jobs);
      
      if (pageNum < maxPages - 1) {
        await fastDelay(1500, 3000); // Faster page delays
      }
    }
    
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
        console.warn('Error returning Indeed browser to pool:', closeError);
        await browser.close().catch(() => {});
      }
    }
  }
}
