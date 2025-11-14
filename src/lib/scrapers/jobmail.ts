import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, FAST_BROWSER_CONFIG, fastDelay, getBrowserFromPool, returnBrowserToPool } from './utils';

export async function scrapeJobMail(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 3 } = config;
  let browser;
  const startTime = Date.now();

  try {
    console.log(`🔍 Starting JobMail scraper for "${query}" in "${location}"`);

    browser = await getBrowserFromPool();
    console.log(`⏱️ Browser acquired in ${Date.now() - startTime}ms`);

    const page = await browser.newPage();
    console.log(`⏱️ Page created in ${Date.now() - startTime}ms`);

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await configureRequestInterception(page, true); // Aggressive blocking for speed
    console.log(`⏱️ Request interception configured in ${Date.now() - startTime}ms`);

    const allJobs: Job[] = [];

    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      // JobMail uses category-based URLs. For general search, use main jobs page
      // and try to search from there, or use category-specific URLs
      let searchUrl;
      
      if (query.toLowerCase().includes('software') || query.toLowerCase().includes('developer') || query.toLowerCase().includes('engineer')) {
        // IT/Computer category
        searchUrl = `https://www.jobmail.co.za/jobs/it-computer?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${pageNum + 1}`;
      } else {
        // General search - use main jobs page with search parameters
        searchUrl = `https://www.jobmail.co.za/jobs/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${pageNum + 1}`;
      }
      
      console.log(`📄 JobMail - Processing page ${pageNum + 1}/${maxPages}`);
      console.log(`   URL: ${searchUrl}`);
      
      try {
        const pageStartTime = Date.now();
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 
        });
        console.log(`   ✓ Page loaded in ${Date.now() - pageStartTime}ms`);
      } catch (navError) {
        console.error(`   ✗ Navigation failed:`, navError);
        // Try main jobs page as fallback
        const fallbackUrl = `https://www.jobmail.co.za/jobs`;
        console.log(`   🔄 Trying fallback URL: ${fallbackUrl}`);
        try {
          await page.goto(fallbackUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
          });
          console.log('   ✓ Fallback URL loaded');
        } catch (fallbackError) {
          console.error(`   ✗ Fallback URL also failed:`, fallbackError);
          continue;
        }
      }

      const scrollStartTime = Date.now();
      await fastDelay(1000, 2000);
      await autoScroll(page);
      console.log(`   ✓ Auto-scroll completed in ${Date.now() - scrollStartTime}ms`);

      // Debug: Check what selectors are available
      const debugSelectors = await page.evaluate(() => {
        const selectors = {
          'article': document.querySelectorAll('article').length,
          '.job-item': document.querySelectorAll('.job-item').length,
          '.job-listing': document.querySelectorAll('.job-listing').length,
          '.vacancy': document.querySelectorAll('.vacancy').length,
          'h3': document.querySelectorAll('h3').length,
          'a[href*="/jobs/"]': document.querySelectorAll('a[href*="/jobs/"]').length,
          'div[class*="job"]': document.querySelectorAll('div[class*="job"]').length,
        };
        return selectors;
      });
      console.log(`📊 JobMail page ${pageNum + 1} - Available selectors:`, debugSelectors);

      const extractStartTime = Date.now();
      const jobs = await page.evaluate((): Job[] => {
        const extractedJobs: Job[] = [];
        
        // JobMail has h3 titles and job links - collect them
        const h3Elements = Array.from(document.querySelectorAll('h3'));
        const jobLinks = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
        
        // Combine and deduplicate
        const processedTitles = new Set<string>();
        
        // Process h3 elements that contain job titles
        h3Elements.forEach(h3 => {
          const title = h3.textContent?.trim();
          if (title && title.length > 5 && !processedTitles.has(title)) {
            processedTitles.add(title);
            
            // Find the associated link
            const link = h3.closest('a') || h3.querySelector('a') || 
                        h3.parentElement?.querySelector('a[href*="/jobs/"]');
            
            if (link) {
              const href = link.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : `https://www.jobmail.co.za${href}`;
              
              // Extract additional info from surrounding text
              const parentText = h3.parentElement?.textContent || h3.parentElement?.parentElement?.textContent || '';
              
              // Try to extract company from patterns like "Company Name - Location"
              let company = 'Various Companies';
              let location = 'South Africa';
              
              // Look for company patterns
              const companyMatch = parentText.match(/([A-Z][a-zA-Z\s&]+)(?:\s*-\s*)/);
              if (companyMatch && companyMatch[1] && companyMatch[1].length > 2) {
                company = companyMatch[1].trim();
              }
              
              // Look for location
              const locationMatch = parentText.match(/(Johannesburg|Pretoria|Cape Town|Durban|Sandton|Randburg|Centurion|Midrand|Roodepoort)/i);
              if (locationMatch) {
                location = locationMatch[1];
              }
              
              extractedJobs.push({
                title,
                company,
                location,
                salary: 'Not specified',
                postedDate: 'Recently',
                description: parentText.substring(0, 150),
                url,
                jobType: 'Full-time',
                source: 'jobmail' as const
              });
            }
          }
        });
        
        // Process standalone job links that weren't caught above
        jobLinks.forEach(link => {
          const title = link.textContent?.trim();
          if (title && title.length > 5 && !processedTitles.has(title)) {
            processedTitles.add(title);
            
            const href = link.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.jobmail.co.za${href}`;
            
            extractedJobs.push({
              title,
              company: 'Various Companies',
              location: 'South Africa',
              salary: 'Not specified',
              postedDate: 'Recently',
              description: link.parentElement?.textContent?.substring(0, 150) || '',
              url,
              jobType: 'Full-time',
              source: 'jobmail' as const
            });
          }
        });
        
        return extractedJobs;
      });

      console.log(`✅ JobMail - Found ${jobs.length} jobs on page ${pageNum + 1} (extraction took ${Date.now() - extractStartTime}ms)`);
      allJobs.push(...jobs);

      if (pageNum < maxPages - 1) {
        await fastDelay(1500, 3000);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 JobMail scraper completed in ${totalTime}ms - Total jobs: ${allJobs.length}`);

    return {
      jobs: allJobs,
      success: true,
      source: 'jobmail',
      count: allJobs.length
    };

  } catch (error) {
    console.error('❌ JobMail scraper error:', error);
    return {
      jobs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'jobmail',
      count: 0
    };
  } finally {
    if (browser) {
      try {
        await returnBrowserToPool(browser);
        console.log('✓ JobMail browser returned to pool');
      } catch (closeError) {
        console.warn('Error returning JobMail browser to pool:', closeError);
        await browser.close().catch(() => {});
      }
    }
  }
}
