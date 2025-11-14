import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapeCareers24(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 1 } = config;
  let browser;
  
  try {
    console.log(`🔍 Starting Careers24 scraper for "${query}" in "${location}"`);
    
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 1; pageNum <= Math.min(maxPages, 5); pageNum++) {
      const searchUrl = `https://www.careers24.com/jobs/results?quicksearch=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${pageNum}`;
      
      console.log(`📄 Careers24 - Processing page ${pageNum}/${maxPages}`);
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
        await page.waitForSelector('article.job, div.listing, div.job-card', { 
          timeout: 10000 
        });
      } catch (e) {
        console.warn('Careers24 - Job listings not found');
      }
      
      await autoScroll(page);
      
      const debugSelectors = await page.evaluate(() => {
        return {
          'article.job': document.querySelectorAll('article.job').length,
          'div.listing': document.querySelectorAll('div.listing').length,
          'div.job-card': document.querySelectorAll('div.job-card').length,
        };
      });
      console.log(`📊 Careers24 page ${pageNum} - Available selectors:`, debugSelectors);
      
      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('article.job, div.listing, div.job-card, div.vacancy');
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('h2 a, h3 a, a.title, .job-title a');
            const title = titleElement?.textContent?.trim() || '';
            
            const companyElement = element.querySelector('.company, .company-name, .advertiser');
            const company = companyElement?.textContent?.trim() || '';
            
            const locationElement = element.querySelector('.location, .area, .region');
            const location = locationElement?.textContent?.trim() || '';
            
            const salaryElement = element.querySelector('.salary, .package, .remuneration');
            const salary = salaryElement?.textContent?.trim() || 'Not specified';
            
            const dateElement = element.querySelector('.date, .post-date, time');
            const postedDate = dateElement?.textContent?.trim() || 
                              dateElement?.getAttribute('datetime') || 'Recently';
            
            const descElement = element.querySelector('.description, .summary, .snippet');
            const description = descElement?.textContent?.trim() || '';
            
            const linkElement = element.querySelector('a.title, h2 a, h3 a, a[href*="/job/"]');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.careers24.com${href}`;
            
            const jobTypeElement = element.querySelector('.employment-type, .job-type');
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
            console.warn('Error extracting Careers24 job:', error);
          }
        });
        
        return extractedJobs;
      });
      
      console.log(`✅ Careers24 - Found ${jobs.length} jobs on page ${pageNum}`);
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
    console.error('❌ Careers24 scraper error:', error);
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
        console.log('✓ Careers24 browser closed');
      } catch (closeError) {
        console.warn('Error closing Careers24 browser:', closeError);
      }
    }
  }
}
