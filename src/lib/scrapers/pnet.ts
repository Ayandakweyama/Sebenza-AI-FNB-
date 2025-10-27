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
        const extractedJobs: Job[] = [];
        
        // PNet specific: Find all job links and extract from their containers
        const jobLinks = document.querySelectorAll('a[href*="/jobs/"]');
        const processedContainers = new Set();
        
        jobLinks.forEach((link) => {
          // Skip if not a job listing link
          const href = link.getAttribute('href') || '';
          if (!href.includes('/jobs/') || href.includes('/search') || href.includes('/alerts')) {
            return;
          }
          
          // Find the container element (usually a parent div or article)
          let container: Element | null = link.closest('div[class*="listing"], article, div[class*="job"], div[class*="result"]');
          if (!container) {
            container = link.parentElement?.parentElement || null;
          }
          
          if (!container || processedContainers.has(container)) {
            return;
          }
          processedContainers.add(container);
          
          // Extract job details from the container
          const title = link.textContent?.trim() || 
                       container.querySelector('h2, h3, h4')?.textContent?.trim() || '';
          
          // Look for company name in various places
          const company = container.querySelector('.company, .company-name, [class*="company"]')?.textContent?.trim() ||
                         container.querySelector('span:not([class*="location"]):not([class*="salary"])')?.textContent?.trim() ||
                         'Company not specified';
          
          // Look for location
          const location = container.querySelector('.location, [class*="location"]')?.textContent?.trim() ||
                          container.querySelector('span[class*="loc"]')?.textContent?.trim() ||
                          'South Africa';
          
          // Look for salary
          const salary = container.querySelector('.salary, [class*="salary"], [class*="pay"]')?.textContent?.trim() ||
                        'Salary not specified';
          
          // Look for date
          const postedDate = container.querySelector('.date, time, [class*="date"], [class*="posted"]')?.textContent?.trim() ||
                           'Recently posted';
          
          // Get description
          const description = container.querySelector('.description, [class*="desc"], p')?.textContent?.trim() ||
                            container.textContent?.replace(title, '').replace(company, '').substring(0, 200).trim() ||
                            'No description available';
          
          const url = href.startsWith('http') ? href : `https://www.pnet.co.za${href}`;
          
          if (title && title.length > 2) {
            extractedJobs.push({
              title,
              company,
              location,
              salary,
              postedDate,
              description,
              url,
              jobType: 'Full-time',
              source: 'pnet' as const
            });
          }
        });
        
        // If still no jobs found, try a more aggressive approach
        if (extractedJobs.length === 0) {
          // Look for any container with job-like content
          const allContainers = document.querySelectorAll('div, article, section');
          allContainers.forEach(container => {
            const text = container.textContent || '';
            const hasJobKeywords = /developer|engineer|manager|analyst|designer/i.test(text);
            const hasLink = container.querySelector('a[href*="/jobs/"]');
            
            if (hasJobKeywords && hasLink && !processedContainers.has(container)) {
              processedContainers.add(container);
              const link = hasLink as HTMLAnchorElement;
              const title = link.textContent?.trim() || 'Job Opening';
              const href = link.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : `https://www.pnet.co.za${href}`;
              
              extractedJobs.push({
                title,
                company: 'See job details',
                location: 'South Africa',
                salary: 'Competitive',
                postedDate: 'Recently posted',
                description: text.substring(0, 200),
                url,
                jobType: 'Full-time',
                source: 'pnet' as const
              });
            }
          });
        }
        
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
