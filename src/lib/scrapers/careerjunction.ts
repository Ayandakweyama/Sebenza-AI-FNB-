import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapeCareerJunction(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 2 } = config;
  let browser;
  
  try {
    console.log(`🔍 Starting CareerJunction scraper for "${query}" in "${location}"`);
    
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Skip request interception for now to avoid "frame detached" errors
    // await configureRequestInterception(page);
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 1; pageNum <= Math.min(maxPages, 10); pageNum++) {
      const searchParams = new URLSearchParams({
        keywords: query,
        location: location,
        pagesize: '20',
        page: pageNum.toString(),
      });
      
      const searchUrl = `https://www.careerjunction.co.za/jobs?${searchParams.toString()}`;
      
      console.log(`📄 CareerJunction - Processing page ${pageNum}/${maxPages}`);
      console.log(`   URL: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',  // Changed from networkidle2
          timeout: 120000 
        });
        console.log('   ✓ Page loaded');
      } catch (navError) {
        console.error(`   ✗ Navigation failed:`, navError);
        throw navError;
      }
      
      await randomDelay(2000, 4000);
      
      try {
        await page.waitForSelector('article.job, div.job-item, div[data-job-id], div.result-item', { 
          timeout: 15000 
        });
      } catch (e) {
        console.warn('CareerJunction - Job listings not found on this page');
      }
      
      try {
        const cookieButton = await page.$('#cookie-consent-accept-all, button[data-testid="cookie-banner-accept-all"]');
        if (cookieButton) {
          await cookieButton.click();
          await randomDelay(1000, 2000);
        }
      } catch (e) {
        console.log('No cookie banner found');
      }
      
      await autoScroll(page);
      
      // Debug: Check what selectors are available
      const debugSelectors = await page.evaluate(() => {
        const selectors = {
          'article.job': document.querySelectorAll('article.job').length,
          'div.job-item': document.querySelectorAll('div.job-item').length,
          'div[data-job-id]': document.querySelectorAll('div[data-job-id]').length,
          'div.result-item': document.querySelectorAll('div.result-item').length,
          'li.job-result': document.querySelectorAll('li.job-result').length,
          'article': document.querySelectorAll('article').length,
        };
        return selectors;
      });
      console.log(`📊 CareerJunction page ${pageNum} - Available selectors:`, debugSelectors);
      
      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('article.job, div.job-item, div[data-job-id], div.result-item, li.job-result');
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('h2 a, h3 a, a.job-title, .job-title a, a[data-job-title]');
            const title = titleElement?.textContent?.trim() || '';
            
            const companyElement = element.querySelector('.company, .company-name, span.employer, div.employer-name');
            const company = companyElement?.textContent?.trim() || '';
            
            const locationElement = element.querySelector('.location, .job-location, span.location, div.job-location');
            const location = locationElement?.textContent?.trim() || '';
            
            const salaryElement = element.querySelector('.salary, .remuneration, span.salary, div.salary-range');
            const salary = salaryElement?.textContent?.trim() || 'Not specified';
            
            const dateElement = element.querySelector('.date, .posted-date, time, span.date-posted');
            const postedDate = dateElement?.textContent?.trim() || 
                              dateElement?.getAttribute('datetime') || 'Recently';
            
            const descElement = element.querySelector('.description, .job-description, .snippet, div.job-snippet');
            const description = descElement?.textContent?.trim() || '';
            
            const refElement = element.querySelector('.reference, .job-reference, span[data-reference]');
            const reference = refElement?.textContent?.trim() || '';
            
            const industryElement = element.querySelector('.industry, span.industry-type');
            const industry = industryElement?.textContent?.trim() || '';
            
            const linkElement = element.querySelector('a.job-title, h2 a, h3 a, a[href*="/jobs/"]');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.careerjunction.co.za${href}`;
            
            const jobTypeElement = element.querySelector('.job-type, .employment-type, span.job-type');
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
                industry,
                reference,
                source: 'careerjunction' as const
              });
            }
          } catch (error) {
            console.warn('Error extracting job:', error);
          }
        });
        
        return extractedJobs;
      });
      
      console.log(`✅ CareerJunction - Found ${jobs.length} jobs on page ${pageNum}`);
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
    console.error('❌ CareerJunction scraper error:', error);
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
        console.log('✓ CareerJunction browser closed');
      } catch (closeError) {
        console.warn('Error closing CareerJunction browser:', closeError);
      }
    }
  }
}
