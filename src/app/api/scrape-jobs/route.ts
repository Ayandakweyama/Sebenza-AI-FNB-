import { NextResponse } from 'next/server';

// Define types for dynamic imports
type PuppeteerExtra = typeof import('puppeteer-extra');
type StealthPlugin = import('puppeteer-extra-plugin-stealth').default;
type Browser = import('puppeteer').Browser;
type Page = import('puppeteer').Page;
type ElementHandle = import('puppeteer').ElementHandle;
type Response = import('puppeteer').Response;
type Request = import('puppeteer').Request;

// Type definitions that extend Puppeteer's types
type PuppeteerBrowser = Browser;
type PuppeteerPage = Page;

// Check if running in Vercel serverless environment
const isVercel = process.env.VERCEL === '1';

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

// Cache for storing browser instance
let _browser: PuppeteerBrowser | null = null;

// Initialize Puppeteer with dynamic imports
async function getPuppeteer() {
  const [puppeteer, StealthPlugin] = await Promise.all([
    import('puppeteer-extra') as Promise<PuppeteerExtra>,
    import('puppeteer-extra-plugin-stealth').then(m => m.default)
  ]);
  
  // Add stealth plugin
  puppeteer.use(StealthPlugin());
  
  return puppeteer;
}

// Auto-scroll function to load all jobs
async function autoScroll(page: Page): Promise<void> {
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
      }).catch(() => {
        console.warn('Job cards not found, continuing with what we have');
      });
    } catch (error) {
      console.warn('Error waiting for job cards:', error);
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

// Helper function to get or create browser instance
async function getBrowser(): Promise<PuppeteerBrowser> {
  if (_browser) {
    return _browser;
  }

  const puppeteer = await getPuppeteer();
  
  // Configure launch options for Vercel
  const launchOptions: any = {
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
      '--disable-software-rasterizer',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--disable-site-isolation-trials',
    ],
  };

  if (isVercel) {
    // Additional configuration for Vercel serverless environment
    launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
  }

  _browser = await puppeteer.launch(launchOptions);
  return _browser;
}

// Clean up browser instance when the server shuts down
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  process.on('exit', () => {
    if (_browser) {
      _browser.close().catch(console.error);
    }
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  // Parse request body with default values
  let query = 'developer';
  let location = 'South Africa';
  let maxPages = 1;
  
  // Limit max pages in production to prevent excessive resource usage
  if (isVercel) {
    maxPages = Math.min(maxPages, 2);
  }
  
  try {
    // Parse the request body
  const requestBody = await new Response(request.body).json() as Partial<ScrapeRequest>;
    query = requestBody.query || query;
    location = requestBody.location || location;
    maxPages = requestBody.maxPages || maxPages;
    
    console.log(`Starting job search with query: "${query}", location: "${location}", maxPages: ${maxPages}`);
  } catch (error) {
    console.warn('Failed to parse request body, using default values. Error:', error);
  }

  // Configure Puppeteer for serverless environment
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
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-extensions',
      '--disable-software-rasterizer',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-notifications',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--disable-client-side-phishing-detection',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--password-store=basic',
      '--use-mock-keychain',
      ...(isVercel ? ['--single-process'] : [])
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: { width: 1366, height: 768 },
    // Set a timeout for the browser launch
    timeout: isVercel ? 30000 : 60000
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
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2' as const, 
        timeout: 60000 
      });
      
      if (!response || !response.ok()) {
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
        await page.waitForTimeout(isVercel ? 1000 : 2000);
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
    // Don't close the browser in production to reuse the instance
    if (!isVercel) {
      await browser.close();
    }
  }
}
