import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapeJobsCoZa(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 1 } = config;
  let browser;
  
  try {
    console.log(`🔍 Starting Jobs.co.za scraper for "${query}" in "${location}"`);
    
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 1; pageNum <= Math.min(maxPages, 5); pageNum++) {
      const searchUrl = `https://www.jobs.co.za/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&page=${pageNum}`;
      
      console.log(`📄 Jobs.co.za - Processing page ${pageNum}/${maxPages}`);
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
      
      await randomDelay(2000, 4000);
      
      try {
        await page.waitForSelector('article.job-listing, div.job-card, div[data-job-id]', { 
          timeout: 10000 
        });
      } catch (e) {
        console.warn('Jobs.co.za - Job listings not found');
      }
      
      await autoScroll(page);
      
      const debugSelectors = await page.evaluate(() => {
        return {
          'article.job-listing': document.querySelectorAll('article.job-listing').length,
          'div.job-card': document.querySelectorAll('div.job-card').length,
          'div[data-job-id]': document.querySelectorAll('div[data-job-id]').length,
        };
      });
      console.log(`📊 Jobs.co.za page ${pageNum} - Available selectors:`, debugSelectors);
      
      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('article.job-listing, div.job-card, div[data-job-id], div.listing');
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('h2 a, h3 a, a.job-title, .listing-title');
            const title = titleElement?.textContent?.trim() || '';
            
            const companyElement = element.querySelector('.company, .company-name, .employer');
            const company = companyElement?.textContent?.trim() || '';
            
            const locationElement = element.querySelector('.location, .job-location, .locality');
            const location = locationElement?.textContent?.trim() || '';
            
            const salaryElement = element.querySelector('.salary, .remuneration, .pay');
            const salary = salaryElement?.textContent?.trim() || 'Not specified';
            
            const dateElement = element.querySelector('.date, .posted-date, time');
            const postedDate = dateElement?.textContent?.trim() || 
                              dateElement?.getAttribute('datetime') || 'Recently';
            
            const descElement = element.querySelector('.description, .job-description, .snippet');
            const description = descElement?.textContent?.trim() || '';
            
            const linkElement = element.querySelector('a.job-title, h2 a, h3 a, a[href*="/job/"]');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.jobs.co.za${href}`;
            
            const jobTypeElement = element.querySelector('.job-type, .employment-type');
            const jobType = jobTypeElement?.textContent?.trim() || 'Full-time';
            
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
                source: 'careerjunction' as const
              });
            }
          } catch (error) {
            console.warn('Error extracting Jobs.co.za job:', error);
          }
        });
        
        return extractedJobs;
      });
      
      console.log(`✅ Jobs.co.za - Found ${jobs.length} jobs on page ${pageNum}`);
      allJobs.push(...jobs);
      
      if (pageNum < maxPages) {
        await randomDelay(3000, 5000);
      }
    }
    
    return {
      jobs: allJobs,
      success: true,
      source: 'careerjunction',
      count: allJobs.length
    };
    
  } catch (error) {
    console.error('❌ Jobs.co.za scraper error:', error);
    return {
      jobs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'careerjunction',
      count: 0
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('✓ Jobs.co.za browser closed');
      } catch (closeError) {
        console.warn('Error closing Jobs.co.za browser:', closeError);
      }
    }
  }
}
