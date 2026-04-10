import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, FAST_BROWSER_CONFIG, fastDelay, getBrowserFromPool, returnBrowserToPool } from './utils';

export async function scrapeIndeed(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 1 } = config; // Reduced to 1 page for faster loading
  let browser;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Starting Indeed scraper for "${query}" in "${location}"`);
    
    browser = await getBrowserFromPool();
    console.log(`⏱️ Browser acquired in ${Date.now() - startTime}ms`);
    
    const page = await browser.newPage();
    console.log(`⏱️ Page created in ${Date.now() - startTime}ms`);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await configureRequestInterception(page, true); // Aggressive blocking for speed
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
          waitUntil: 'domcontentloaded',  // Changed from networkidle2
          timeout: 60000 
        });
        console.log(`   ✓ Page loaded in ${Date.now() - pageStartTime}ms`);
      } catch (navError) {
        console.error(`   ✗ Navigation failed:`, navError);
        throw navError;
      }
      
      const scrollStartTime = Date.now();
      await fastDelay(1000, 2000); // Faster delays
      await autoScroll(page);
      console.log(`   ✓ Auto-scroll completed in ${Date.now() - scrollStartTime}ms`);
      
      // Debug: Check what selectors are available
      const debugSelectors = await page.evaluate(() => {
        const selectors = {
          'div.job_seen_beacon': document.querySelectorAll('div.job_seen_beacon').length,
          'div.jobsearch-SerpJobCard': document.querySelectorAll('div.jobsearch-SerpJobCard').length,
          'div[data-jk]': document.querySelectorAll('div[data-jk]').length,
          'article': document.querySelectorAll('article').length,
          'div[class*="job"]': document.querySelectorAll('div[class*="job"]').length,
          'div[data-testid="job-card-container"]': document.querySelectorAll('div[data-testid="job-card-container"]').length,
          'div[data-testid="job-card"]': document.querySelectorAll('div[data-testid="job-card"]').length,
          'div[data-jk][data-testid]': document.querySelectorAll('div[data-jk][data-testid]').length,
          'li[data-testid]': document.querySelectorAll('li[data-testid]').length,
          'div[class*="JobCard"]': document.querySelectorAll('div[class*="JobCard"]').length,
          'div[data-testid="mosaic-job-card"]': document.querySelectorAll('div[data-testid="mosaic-job-card"]').length,
        };
        return selectors;
      });
      console.log(`📊 Indeed page ${pageNum + 1} - Available selectors:`, debugSelectors);
      
      const extractStartTime = Date.now();
      const jobs = await page.evaluate((): Job[] => {
        // Try multiple selector strategies for Indeed's changing structure
        const jobElements = document.querySelectorAll(
          'div.job_seen_beacon, ' +
          'div.jobsearch-SerpJobCard, ' +
          'div[data-jk], ' +
          'div[data-testid="job-card"], ' +
          'div[data-testid="mosaic-job-card"], ' +
          'div[data-testid="job-card-container"] > div, ' +
          'li[data-testid*="job"], ' +
          'div[class*="JobCard"], ' +
          'article[data-testid]'
        );
        const extractedJobs: Job[] = [];
        
        jobElements.forEach((element) => {
          try {
            // Enhanced title extraction with more current selectors
            const titleElement = element.querySelector(
              'h2.jobTitle a, ' +
              'h2.jobTitle span, ' +
              'a[data-jk] span[title], ' +
              'h2 a span[title], ' +
              '.jobTitle a, ' +
              'div[data-testid="job-title"] a, ' +
              'div[data-testid="job-title"] span, ' +
              'a[class*="jcs-JobTitle"] span, ' +
              'span[id*="jobTitle"] a'
            );
            const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
            
            // Enhanced company extraction with current selectors
            const companyElement = element.querySelector(
              'span[data-testid="company-name"], ' +
              'span.companyName, ' +
              'a[data-testid="company-name"], ' +
              '.companyName a, ' +
              'div[data-testid="company-name"], ' +
              'a[class*="css-1x7z1ps"]'
            );
            const company = companyElement?.textContent?.trim() || '';
            
            // Enhanced location extraction with current selectors
            const locationElement = element.querySelector(
              'div[data-testid="text-location"], ' +
              'div.companyLocation, ' +
              '.companyLocation, ' +
              'div[data-testid="job-location"], ' +
              'div[class*="companyLocation"]'
            );
            const location = locationElement?.textContent?.trim() || '';
            
            // Enhanced salary extraction with current selectors
            const salaryElement = element.querySelector(
              'div.salary-snippet, ' +
              'div[data-testid="attribute_snippet_testid"], ' +
              '.salaryText, ' +
              'span.salaryText, ' +
              'div[data-testid="job-salary"], ' +
              'div[class*="salary-snippet"]'
            );
            const salary = salaryElement?.textContent?.trim() || 'Not specified';
            
            // Enhanced date extraction with current selectors
            const dateElement = element.querySelector(
              'span.date, ' +
              'span[data-testid="myJobsStateDate"], ' +
              '.date, ' +
              'div[data-testid="job-age"], ' +
              'span[class*="date"]'
            );
            const postedDate = dateElement?.textContent?.trim() || 'Recently';
            
            // Enhanced description extraction with current selectors
            const snippetElement = element.querySelector(
              'div.job-snippet, ' +
              'div[class*="snippet"], ' +
              '.summary, ' +
              'div.jobsearch-jobDescriptionText, ' +
              'div[data-testid="job-snippet"], ' +
              'div[class*="job-snippet"]'
            );
            const description = snippetElement?.textContent?.trim() || '';
            
            // Enhanced URL extraction with current selectors
            const linkElement = element.querySelector(
              'a[data-jk], ' +
              'h2.jobTitle a, ' +
              '.jobTitle a, ' +
              'a[href*="/viewjob"], ' +
              'a[class*="jcs-JobTitle"], ' +
              'div[data-testid="job-title"] a, ' +
              'a[id*="job_"]'
            );
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://za.indeed.com${href}`;
            
            // Enhanced job type extraction with current selectors
            const jobTypeElement = element.querySelector(
              'div[data-testid="attribute_snippet_testid"], ' +
              'div.metadata, ' +
              '.jobTypeLabel, ' +
              'div[data-testid="job-type"], ' +
              'div[class*="jobType"]'
            );
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
      
      console.log(`✅ Indeed - Found ${jobs.length} jobs on page ${pageNum + 1} (extraction took ${Date.now() - extractStartTime}ms)`);
      allJobs.push(...jobs);
      
      if (pageNum < maxPages - 1) {
        await fastDelay(1500, 3000); // Faster page delays
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
        // Continue - don't let cleanup errors break the response
      }
    }
  }
}
