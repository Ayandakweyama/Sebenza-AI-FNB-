import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapeLinkedIn(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 1 } = config;
  let browser;
  
  try {
    console.log(`🔍 Starting LinkedIn scraper for "${query}" in "${location}"`);
    
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 0; pageNum < Math.min(maxPages, 3); pageNum++) {
      const start = pageNum * 25;
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${start}`;
      
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
      
      await randomDelay(3000, 5000);
      
      try {
        await page.waitForSelector('ul.jobs-search__results-list li, div.base-card, div.job-search-card', { 
          timeout: 10000 
        });
      } catch (e) {
        console.warn('LinkedIn - Job listings not found');
      }
      
      await autoScroll(page);
      
      const debugSelectors = await page.evaluate(() => {
        return {
          'ul.jobs-search__results-list li': document.querySelectorAll('ul.jobs-search__results-list li').length,
          'div.base-card': document.querySelectorAll('div.base-card').length,
          'div.job-search-card': document.querySelectorAll('div.job-search-card').length,
        };
      });
      console.log(`📊 LinkedIn page ${pageNum + 1} - Available selectors:`, debugSelectors);
      
      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('ul.jobs-search__results-list li, div.base-card, div.job-search-card');
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('h3.base-search-card__title, a.job-search-card__title, h3');
            const title = titleElement?.textContent?.trim() || '';
            
            const companyElement = element.querySelector('h4.base-search-card__subtitle, a.job-search-card__subtitle-link, h4');
            const company = companyElement?.textContent?.trim() || '';
            
            const locationElement = element.querySelector('span.job-search-card__location, span.job-result-card__location');
            const location = locationElement?.textContent?.trim() || '';
            
            const dateElement = element.querySelector('time, span.job-search-card__listdate, span.job-result-card__listdate');
            const postedDate = dateElement?.textContent?.trim() || 
                              dateElement?.getAttribute('datetime') || 'Recently';
            
            const linkElement = element.querySelector('a.base-card__full-link, a.job-search-card__link-wrapper');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
            
            if (title && company) {
              extractedJobs.push({
                title,
                company,
                location,
                salary: 'Not specified',
                postedDate,
                description: '',
                url,
                jobType: 'Full-time',
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
      
      if (pageNum < maxPages - 1) {
        await randomDelay(3000, 5000);
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
