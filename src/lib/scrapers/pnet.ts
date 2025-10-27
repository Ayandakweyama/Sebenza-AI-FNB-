import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapePnet(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 2 } = config;
  let browser;
  
  try {
    console.log(`🔍 Starting Pnet scraper for "${query}" in "${location}"`);
    
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Skip request interception for now to avoid "frame detached" errors
    // await configureRequestInterception(page);
    
    const allJobs: Job[] = [];
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const searchUrl = `https://www.pnet.co.za/jobs/search-results.html?s=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&p=${pageNum}`;
      
      console.log(`📄 Pnet - Processing page ${pageNum}/${maxPages}`);
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
      
      await randomDelay(2000, 4000);
      
      try {
        await page.waitForSelector('article.job-result, div.job-item, div[data-job-id]', { 
          timeout: 10000 
        });
      } catch (e) {
        console.warn('Pnet - Job listings not found on this page');
      }
      
      await autoScroll(page);
      
      // Debug: Check what selectors are available
      const debugSelectors = await page.evaluate(() => {
        const selectors = {
          'article.job-result': document.querySelectorAll('article.job-result').length,
          'div.job-item': document.querySelectorAll('div.job-item').length,
          'div[data-job-id]': document.querySelectorAll('div[data-job-id]').length,
          'div.result': document.querySelectorAll('div.result').length,
          'article': document.querySelectorAll('article').length,
          'div.listing': document.querySelectorAll('div.listing').length,
          'div[class*="listing"]': document.querySelectorAll('div[class*="listing"]').length,
          'div[class*="job"]': document.querySelectorAll('div[class*="job"]').length,
          'a[href*="/jobs/"]': document.querySelectorAll('a[href*="/jobs/"]').length,
        };
        return selectors;
      });
      console.log(`📊 Pnet page ${pageNum} - Available selectors:`, debugSelectors);
      
      const jobs = await page.evaluate((): Job[] => {
        // Try multiple selector strategies for PNet
        let jobElements = document.querySelectorAll('article.job-result, div.job-item, div[data-job-id]');
        
        // If no jobs found, try broader selectors
        if (jobElements.length === 0) {
          jobElements = document.querySelectorAll('div.listing, div[class*="listing"], div[class*="job-card"]');
        }
        
        // Last resort - find all links that look like job postings
        if (jobElements.length === 0) {
          const jobLinks = document.querySelectorAll('a[href*="/jobs/"]');
          const uniqueJobs = new Set();
          jobLinks.forEach(link => {
            const parent = link.closest('div, article, section');
            if (parent && !uniqueJobs.has(parent)) {
              uniqueJobs.add(parent);
            }
          });
          jobElements = Array.from(uniqueJobs) as any;
        }
        
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('h2 a, h3 a, a.job-title, .title a');
            const title = titleElement?.textContent?.trim() || '';
            
            const companyElement = element.querySelector('.company, .company-name, span[itemprop="name"]');
            const company = companyElement?.textContent?.trim() || '';
            
            const locationElement = element.querySelector('.location, .job-location, span[itemprop="addressLocality"]');
            const location = locationElement?.textContent?.trim() || '';
            
            const salaryElement = element.querySelector('.salary, .job-salary, .salary-range');
            const salary = salaryElement?.textContent?.trim() || 'Not specified';
            
            const dateElement = element.querySelector('.date, .posted-date, time');
            const postedDate = dateElement?.textContent?.trim() || 
                              dateElement?.getAttribute('datetime') || 'Recently';
            
            const descElement = element.querySelector('.description, .job-description, .snippet');
            const description = descElement?.textContent?.trim() || '';
            
            const linkElement = element.querySelector('a.job-title, h2 a, h3 a, a[href*="/job/"]');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.pnet.co.za${href}`;
            
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
                source: 'pnet' as const
              });
            }
          } catch (error) {
            console.warn('Error extracting job:', error);
          }
        });
        
        return extractedJobs;
      });
      
      console.log(`✅ Pnet - Found ${jobs.length} jobs on page ${pageNum}`);
      allJobs.push(...jobs);
      
      if (pageNum < maxPages) {
        await randomDelay(3000, 5000);
      }
    }
    
    return {
      jobs: allJobs,
      success: true,
      source: 'pnet',
      count: allJobs.length
    };
    
  } catch (error) {
    console.error('❌ Pnet scraper error:', error);
    return {
      jobs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'pnet',
      count: 0
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('✓ Pnet browser closed');
      } catch (closeError) {
        console.warn('Error closing Pnet browser:', closeError);
      }
    }
  }
}
