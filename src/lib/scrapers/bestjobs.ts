import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapeBestJobs(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 1 } = config;
  let browser;
  
  try {
    console.log(`🔍 Starting BestJobs scraper for "${query}" in "${location}"`);
    
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 1; pageNum <= Math.min(maxPages, 5); pageNum++) {
      const searchUrl = `https://www.bestjobs.co.za/jobs?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${pageNum}`;
      
      console.log(`📄 BestJobs - Processing page ${pageNum}/${maxPages}`);
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
        await page.waitForSelector('article.job, div.job-item, div.vacancy-item', { 
          timeout: 10000 
        });
      } catch (e) {
        console.warn('BestJobs - Job listings not found');
      }
      
      await autoScroll(page);
      
      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('article.job, div.job-item, div.vacancy-item, li.job-result');
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('h2 a, h3 a, a.job-title');
            const title = titleElement?.textContent?.trim() || '';
            
            const companyElement = element.querySelector('.company, .company-name, .employer');
            const company = companyElement?.textContent?.trim() || '';
            
            const locationElement = element.querySelector('.location, .job-location');
            const location = locationElement?.textContent?.trim() || '';
            
            const salaryElement = element.querySelector('.salary, .remuneration');
            const salary = salaryElement?.textContent?.trim() || 'Not specified';
            
            const dateElement = element.querySelector('.date, .posted-date, time');
            const postedDate = dateElement?.textContent?.trim() || 
                              dateElement?.getAttribute('datetime') || 'Recently';
            
            const descElement = element.querySelector('.description, .job-description');
            const description = descElement?.textContent?.trim() || '';
            
            const linkElement = element.querySelector('a.job-title, h2 a, h3 a');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.bestjobs.co.za${href}`;
            
            if (title && company) {
              extractedJobs.push({
                title,
                company,
                location,
                salary,
                postedDate,
                description,
                url,
                jobType: 'Full-time',
                source: 'careerjunction' as const
              });
            }
          } catch (error) {
            console.warn('Error extracting BestJobs job:', error);
          }
        });
        
        return extractedJobs;
      });
      
      console.log(`✅ BestJobs - Found ${jobs.length} jobs on page ${pageNum}`);
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
    console.error('❌ BestJobs scraper error:', error);
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
        console.log('✓ BestJobs browser closed');
      } catch (closeError) {
        console.warn('Error closing BestJobs browser:', closeError);
      }
    }
  }
}
