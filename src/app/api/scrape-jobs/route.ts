import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Type definitions for Puppeteer
interface PuppeteerBrowser {
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
}

interface PuppeteerPage {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<HTTPResponse>;
  setUserAgent(userAgent: string): Promise<void>;
  setViewport(viewport: { width: number; height: number }): Promise<void>;
  setRequestInterception(enable: boolean): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;
  $(selector: string): Promise<ElementHandle | null>;
  on(event: string, handler: (request: PuppeteerRequest) => void): void;
  click(selector: string): Promise<void>;
  title(): Promise<string>;
}

interface HTTPResponse {
  ok(): boolean;
  status(): number;
  statusText(): string;
}

interface ElementHandle {
  click(): Promise<void>;
  getAttribute(attribute: string): Promise<string | null>;
  evaluate<T>(pageFunction: (element: Element) => T): Promise<T>;
  textContent(): Promise<string | null>;
}

interface PuppeteerRequest {
  resourceType(): string;
  abort(): void;
  continue(): void;
}

// Interface for job data
interface Job {
  title: string;
  company: string;
  location: string;
  salary: string;
  postedDate: string;
  description: string;
  url: string;
  jobType?: string;
}

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Auto-scroll function to load all jobs
async function autoScroll(page: PuppeteerPage): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Extract job data from the page
async function extractJobData(page: PuppeteerPage): Promise<Job[]> {
  try {
    // First, wait for job cards to be present on the page
    try {
      await page.waitForSelector('div.job_seen_beacon, div.jobsearch-SerpJobCard, div[data-tn-component="organicJob"]', {
        timeout: 15000
      });
    } catch (error) {
      console.warn('Job cards not found, continuing with what we have');
    }

    return await page.evaluate((): Job[] => {
      const jobs: Job[] = [];
      const jobElements = document.querySelectorAll('div.job_seen_beacon, div.jobsearch-SerpJobCard, div[data-tn-component="organicJob"]');
      
      jobElements.forEach((element) => {
        try {
          const titleElement = element.querySelector('h2.jobTitle a, h2.jobTitle span, h2.jobTitle');
          const title = titleElement?.textContent?.trim() || 'No title';
          
          const companyElement = element.querySelector('span.companyName');
          const company = companyElement?.textContent?.trim() || 'No company';
          
          const locationElement = element.querySelector('div.companyLocation, div[data-testid="text-location"]');
          const location = locationElement?.textContent?.trim() || 'No location';
          
          const salaryElement = element.querySelector('div.salary-snippet, div[data-testid="attribute_snippet_testid"]');
          const salary = salaryElement?.textContent?.trim() || 'Not specified';
          
          const dateElement = element.querySelector('span.date, span[data-testid="myJobsStateDate"]');
          const postedDate = dateElement?.textContent?.trim() || 'No date';
          
          const linkElement = element.querySelector('a.jcs-JobTitle, a[data-jk]');
          const url = linkElement?.getAttribute('href') || '#';
          
          jobs.push({
            title,
            company,
            location,
            salary,
            postedDate,
            description: '', // Will be filled in the detailed view
            url: url.startsWith('http') ? url : `https://indeed.com${url}`
          });
        } catch (error) {
          console.warn('Error processing job element:', error);
          // Skip this job if there's an error
        }
      });
      
      return jobs;
    });
  } catch (error) {
    console.error('Error in extractJobData:', error);
    return [];
  }
}

interface ScrapeRequest {
  query?: string;
  location?: string;
  maxPages?: number;
}

export async function POST(request: Request) {
  // Parse request body with default values
  let query = 'developer';
  let location = 'South Africa';
  let maxPages = 1;
  
  try {
    const requestBody = await request.json() as Partial<ScrapeRequest>;
    query = requestBody.query || query;
    location = requestBody.location || location;
    maxPages = requestBody.maxPages || maxPages;
    
    console.log(`Starting job search with query: "${query}", location: "${location}", maxPages: ${maxPages}`);
  } catch (error) {
    console.warn('Failed to parse request body, using default values. Error:', error);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: null
  });

  try {
    const page = await browser.newPage();
    
    // Set a modern user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    
    // Enable request interception to block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req: PuppeteerRequest) => {
      const resourceType = req.resourceType();
      // Only allow document, xhr, fetch, script, and websocket requests
      if (['image', 'stylesheet', 'font', 'media', 'imageset', 'manifest', 'other'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Set a timeout for page operations
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    const allJobs: Job[] = [];
    let currentPage = 0;
    let hasNextPage = true;

    while (currentPage < maxPages && hasNextPage) {
      const offset = currentPage * 10;
      const url = `https://za.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${offset}`;
      
      console.log(`Navigating to page ${currentPage + 1}: ${url}`);
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      if (!response?.ok()) {
        throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
      }

      // Check for CAPTCHA or error pages
      const pageTitle = await page.title().catch(() => '');
      const pageContent = await page.content().catch(() => '');
      
      if (pageTitle.toLowerCase().includes('captcha') || 
          pageContent.toLowerCase().includes('captcha') ||
          pageTitle.toLowerCase().includes('oops') ||
          pageContent.toLowerCase().includes('unusual traffic')) {
        console.error('CAPTCHA or security check detected on the page');
        throw new Error('CAPTCHA or security check detected. Please try again later or use a different IP address.');
      }

      // Scroll to load all jobs
      console.log('Scrolling to load all jobs...');
      await autoScroll(page);
      
      // Extract job data
      console.log('Extracting job data...');
      const jobs = await extractJobData(page);
      allJobs.push(...jobs);
      
      // Check for next page
      const nextPageExists = await page.evaluate(() => {
        return document.querySelector('a[data-testid="pagination-page-next"]') !== null;
      });
      
      hasNextPage = nextPageExists;
      currentPage++;
      
      // Add a small delay between page loads
      if (hasNextPage && currentPage < maxPages) {
        await page.waitForTimeout(2000);
      }
    }

    console.log(`Successfully scraped ${allJobs.length} jobs`);
    return NextResponse.json({ success: true, jobs: allJobs });

  } catch (error) {
    console.error('Error during scraping:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
}
