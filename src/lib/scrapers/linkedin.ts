import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapeLinkedIn(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 1 } = config;
  let browser;
  
  try {
    console.log(`🔍 Starting LinkedIn scraper for "${query}" in "${location}"`);
    
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set extra headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const start = pageNum * 25; // LinkedIn shows 25 jobs per page
      
      // Use LinkedIn's job search URL structure
      const searchParams = new URLSearchParams({
        keywords: query,
        location: location,
        start: start.toString(),
        f_TPR: 'r604800', // Jobs posted in last week
        f_JT: 'F,P,C', // Full-time, Part-time, Contract
        sortBy: 'DD' // Sort by date posted (most recent first)
      });
      
      const searchUrl = `https://www.linkedin.com/jobs/search?${searchParams.toString()}`;
      
      console.log(`📄 LinkedIn - Processing page ${pageNum + 1}/${maxPages}`);
      console.log(`   URL: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        console.log('   ✓ Page loaded');
      } catch (navError) {
        console.error(`   ✗ Navigation failed:`, navError);
        throw navError;
      }
      
      await randomDelay(3000, 5000); // Longer delay for LinkedIn
      
      // Handle potential login prompts or overlays
      try {
        const skipButton = await page.$('button[data-tracking-control-name="public_jobs_contextual-sign-up-modal_modal_dismiss"]');
        if (skipButton) {
          await skipButton.click();
          await randomDelay(1000, 2000);
        }
      } catch (e) {
        console.log('No login modal found');
      }
      
      // Wait for job listings to load
      try {
        await page.waitForSelector('div.job-search-card, li.result-card, div.base-card', { 
          timeout: 15000 
        });
      } catch (e) {
        console.warn('LinkedIn - Job listings not found on this page');
      }
      
      await autoScroll(page);
      
      // Debug: Check what selectors are available
      const debugSelectors = await page.evaluate(() => {
        const selectors = {
          'div.job-search-card': document.querySelectorAll('div.job-search-card').length,
          'li.result-card': document.querySelectorAll('li.result-card').length,
          'div.base-card': document.querySelectorAll('div.base-card').length,
          'div.jobs-search__results-list li': document.querySelectorAll('div.jobs-search__results-list li').length,
          'article': document.querySelectorAll('article').length,
        };
        return selectors;
      });
      console.log(`📊 LinkedIn page ${pageNum + 1} - Available selectors:`, debugSelectors);
      
      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('div.job-search-card, li.result-card, div.base-card, div.jobs-search__results-list li');
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            // Title extraction with multiple selectors
            const titleElement = element.querySelector('h3.base-search-card__title a, h4.base-search-card__title a, a.job-search-card__title-link, h3 a[data-tracking-control-name="public_jobs_jserp-result_search-card"]');
            const title = titleElement?.textContent?.trim() || '';
            
            // Company extraction
            const companyElement = element.querySelector('h4.base-search-card__subtitle a, a.hidden-nested-link, span.job-search-card__subtitle-link, a[data-tracking-control-name="public_jobs_jserp-result_job-search-card-subtitle"]');
            const company = companyElement?.textContent?.trim() || '';
            
            // Location extraction
            const locationElement = element.querySelector('span.job-search-card__location, span.job-result-card__location, div.base-search-card__metadata span');
            const location = locationElement?.textContent?.trim() || '';
            
            // Salary is rarely shown on LinkedIn job listings
            const salary = 'Not specified';
            
            // Posted date extraction
            const dateElement = element.querySelector('time, span.job-search-card__listdate, span.job-result-card__listdate');
            const postedDate = dateElement?.textContent?.trim() || 
                              dateElement?.getAttribute('datetime') || 'Recently';
            
            // Description/snippet extraction
            const descElement = element.querySelector('p.job-search-card__snippet, div.job-search-card__snippet, p[data-max-lines]');
            const description = descElement?.textContent?.trim() || '';
            
            // URL extraction
            const linkElement = element.querySelector('a.job-search-card__title-link, h3.base-search-card__title a, h4.base-search-card__title a');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
            
            // Job type extraction (LinkedIn doesn't always show this)
            const jobTypeElement = element.querySelector('span.job-search-card__job-insight, div.job-search-card__job-insight');
            const jobTypeText = jobTypeElement?.textContent?.toLowerCase() || '';
            const jobType = jobTypeText.includes('full-time') ? 'Full-time' : 
                           jobTypeText.includes('part-time') ? 'Part-time' : 
                           jobTypeText.includes('contract') ? 'Contract' : 
                           jobTypeText.includes('internship') ? 'Internship' :
                           'Full-time'; // Default
            
            if (title && company && url) {
              extractedJobs.push({
                title,
                company,
                location,
                salary,
                postedDate,
                description,
                url,
                jobType,
                source: 'linkedin' as const
              });
            }
          } catch (error) {
            console.warn('Error extracting LinkedIn job:', error);
          }
        });
        
        return extractedJobs;
      });
      
      console.log(`✅ LinkedIn - Found ${jobs.length} jobs on page ${pageNum + 1}`);
      allJobs.push(...jobs);
      
      // Longer delay between pages for LinkedIn
      if (pageNum < maxPages - 1) {
        await randomDelay(5000, 8000);
      }
    }
    
    return {
      jobs: allJobs,
      success: true,
      source: 'linkedin',
      count: allJobs.length
    };
    
  } catch (error) {
    console.error('❌ LinkedIn scraper error:', error);
    return {
      jobs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'linkedin',
      count: 0
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('✓ LinkedIn browser closed');
      } catch (closeError) {
        console.warn('Error closing LinkedIn browser:', closeError);
      }
    }
  }
}
