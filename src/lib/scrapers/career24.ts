import puppeteer from 'puppeteer';
import type { Job, ScraperConfig, ScraperResult } from './types';
import { autoScroll, configureRequestInterception, BROWSER_CONFIG, randomDelay } from './utils';

export async function scrapeCareer24(config: ScraperConfig): Promise<ScraperResult> {
  const { query, location, maxPages = 2 } = config;
  let browser;

  try {
    console.log(`🔍 Starting Career24 scraper for "${query}" in "${location}"`);

    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Skip request interception for now to avoid "frame detached" errors
    // await configureRequestInterception(page);

    const allJobs: Job[] = [];

    for (let pageNum = 1; pageNum <= Math.min(maxPages, 10); pageNum++) {
      const searchUrl = `https://www.career24.com/jobs/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${pageNum}`;

      console.log(`📄 Career24 - Processing page ${pageNum}/${maxPages}`);
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
        await page.waitForSelector('article.job, div.job-item, div[data-job-id], div.job-card, .job-listing', {
          timeout: 15000
        });
      } catch (e) {
        console.warn('Career24 - Job listings not found on this page');
      }

      try {
        const cookieButton = await page.$('#cookie-consent-accept-all, button[data-testid="cookie-banner-accept-all"], .cookie-accept-all');
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
          'div.job-card': document.querySelectorAll('div.job-card').length,
          '.job-listing': document.querySelectorAll('.job-listing').length,
          'article': document.querySelectorAll('article').length,
          'div[class*="job"]': document.querySelectorAll('div[class*="job"]').length,
        };
        return selectors;
      });
      console.log(`📊 Career24 page ${pageNum} - Available selectors:`, debugSelectors);

      const jobs = await page.evaluate((): Job[] => {
        const jobElements = document.querySelectorAll('article.job, div.job-item, div[data-job-id], div.job-card, .job-listing, div[class*="job"]');
        const extractedJobs: Job[] = [];

        jobElements.forEach((element) => {
          try {
            const titleElement = element.querySelector('h2 a, h3 a, a.job-title, .job-title a, a[data-job-title], h1 a, h2, h3');
            const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';

            const companyElement = element.querySelector('.company, .company-name, span.employer, div.employer-name, .employer, [class*="company"]');
            const company = companyElement?.textContent?.trim() || '';

            const locationElement = element.querySelector('.location, .job-location, span.location, div.job-location, [class*="location"], address');
            const location = locationElement?.textContent?.trim() || 'South Africa';

            const salaryElement = element.querySelector('.salary, .remuneration, span.salary, div.salary-range, [class*="salary"], [class*="pay"], .compensation');
            const salary = salaryElement?.textContent?.trim() || 'Salary not specified';

            const dateElement = element.querySelector('.date, .posted-date, time, span.date-posted, [class*="date"], [class*="posted"]');
            const postedDate = dateElement?.textContent?.trim() || 'Recently posted';

            const descriptionElement = element.querySelector('.description, [class*="desc"], .summary, .job-description, p');
            const description = descriptionElement?.textContent?.trim() || 'No description available';

            const linkElement = element.querySelector('a[href*="/jobs/"], a[href*="/job/"], h2 a, h3 a, a.job-title');
            const href = linkElement?.getAttribute('href') || '';
            const url = href.startsWith('http') ? href : `https://www.career24.com${href}`;

            // Extract job type if available
            const jobTypeElement = element.querySelector('[class*="type"], [class*="contract"], [class*="employment"]');
            const jobTypeText = jobTypeElement?.textContent?.toLowerCase() || '';
            const jobType = jobTypeText.includes('full-time') || jobTypeText.includes('full time') ? 'Full-time' :
                           jobTypeText.includes('part-time') || jobTypeText.includes('part time') ? 'Part-time' :
                           jobTypeText.includes('contract') ? 'Contract' :
                           jobTypeText.includes('temporary') ? 'Temporary' :
                           jobTypeText.includes('freelance') ? 'Freelance' :
                           'Full-time';

            if (title && title.length > 2) {
              extractedJobs.push({
                title,
                company: company || 'Company not specified',
                location,
                salary,
                postedDate,
                description,
                url,
                jobType,
                source: 'career24' as const
              });
            }
          } catch (e) {
            console.error('Error extracting job from Career24:', e);
          }
        });

        return extractedJobs;
      });

      console.log(`   Found ${jobs.length} jobs on page ${pageNum}`);
      allJobs.push(...jobs);

      // Add delay between pages
      if (pageNum < maxPages) {
        await randomDelay(2000, 4000);
      }
    }

    await browser.close();

    console.log(`✅ Career24 scraper completed: ${allJobs.length} jobs found`);
    return {
      jobs: allJobs,
      success: true,
      error: null,
      source: 'career24',
      count: allJobs.length
    };

  } catch (error) {
    console.error('❌ Career24 scraper error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    return {
      jobs: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      source: 'career24',
      count: 0
    };
  }
}
