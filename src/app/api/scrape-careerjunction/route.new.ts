import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { randomInt } from 'crypto';
import type { Browser, Page } from 'puppeteer';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Define the Job interface
interface Job {
  title: string;
  company: string;
  location: string;
  salary: string;
  postedDate: string;
  description: string;
  jobType?: string;
  industry?: string;
  reference?: string;
  url: string;
  source: string;
}

// Configuration
const CONFIG = {
  baseUrl: 'https://www.careerjunction.co.za',
  navigation: {
    timeout: 120000, // 2 minutes
    waitUntil: 'networkidle2' as const,
    waitForSelectorTimeout: 15000, // 15 seconds
    delayBetweenPages: { min: 2000, max: 5000 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  browser: {
    headless: 'new' as const,
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
    defaultViewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
    timeout: 30000 // 30 seconds
  }
};

// Helper function to add random delays
const randomDelay = (min: number, max: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, randomInt(min, max)));

// Auto-scroll function
const autoScroll = async (page: Page) => {
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
};

export async function POST(request: Request) {
  console.log('🔍 Starting CareerJunction scraper...');
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Parse and validate request body
    let requestBody: { query?: string; location?: string; maxPages?: number | string };
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body',
          message: 'The request body must be a valid JSON object',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    const { query = '', location = '', maxPages = 2 } = requestBody;
    const validatedMaxPages = Math.min(Math.max(1, Number(maxPages) || 1), 10);
    
    console.log(`📝 Received request with query: "${query}", location: "${location}", maxPages: ${validatedMaxPages}`);
    
    const jobs: Job[] = [];

    // Launch the browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      ...CONFIG.browser,
      headless: CONFIG.browser.headless === 'new' ? true : CONFIG.browser.headless
    });
    
    if (!browser) throw new Error('Failed to launch browser');
    
    // Set up browser error handling
    browser.on('disconnected', () => {
      console.log('Browser was disconnected');
    });
    
    // Create a new page
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(CONFIG.navigation.timeout);
    await page.setDefaultTimeout(30000);
    await page.setViewport(CONFIG.browser.defaultViewport);
    
    // Set up request interception to block unnecessary resources
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'imageset', 'manifest', 'other'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Log failed requests
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      console.warn(`❌ Request failed: ${request.url()} - ${failure?.errorText || 'Unknown error'}`);
    });
    
    // Set up console logging
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error(`PAGE ERROR: ${text}`);
      } else if (type === 'warning') {
        console.warn(`PAGE WARNING: ${text}`);
      } else {
        console.log(`PAGE LOG [${type}]: ${text}`);
      }
    });
    
    // Build search URL
    const searchParams = new URLSearchParams({
      keywords: query.toString(),
      location: location.toString(),
      pagesize: '20',
      page: '1',
    });
    
    const searchUrl = `${CONFIG.baseUrl}/jobs?${searchParams.toString()}`;
    console.log(`🌐 Navigating to: ${searchUrl}`);
    
    // Navigate to the search page
    console.log('🔄 Navigating to search page...');
    const response = await page.goto(searchUrl, {
      waitUntil: CONFIG.navigation.waitUntil,
      timeout: CONFIG.navigation.timeout
    });
    
    if (!response || !response.ok()) {
      throw new Error(`Failed to load page: ${response?.statusText() || 'Unknown error'}`);
    }
    
    // Auto-scroll to load all jobs
    console.log('🔍 Scrolling to load all jobs...');
    await autoScroll(page);
    
    // Extract job data from the page
    console.log('📊 Extracting job data...');
    const pageJobs = await page.evaluate((baseUrl: string) => {
      const jobElements = Array.from(document.querySelectorAll('.job-listing, [data-testid="job-card"], .job-card, .job-item, article.job'));
      
      return jobElements.map(element => {
        try {
          const titleElement = element.querySelector('h2, .job-title, [data-testid="job-title"], .title') as HTMLElement;
          const companyElement = element.querySelector('.company, [data-testid="company-name"], .employer') as HTMLElement;
          const locationElement = element.querySelector('.location, [data-testid="job-location"], .area') as HTMLElement;
          const salaryElement = element.querySelector('.salary, [data-testid="job-salary"]') as HTMLElement;
          const dateElement = element.querySelector('.date, [data-testid="job-date"], time') as HTMLElement;
          const descriptionElement = element.querySelector('.description, [data-testid="job-description"]') as HTMLElement;
          const typeElement = element.querySelector('.job-type, [data-testid="job-type"]') as HTMLElement;
          const industryElement = element.querySelector('.industry, [data-testid="job-industry"]') as HTMLElement;
          const referenceElement = element.querySelector('.reference, [data-testid="job-reference"]') as HTMLElement;
          
          const title = titleElement?.innerText?.trim() || 'No title';
          const company = companyElement?.innerText?.trim() || 'Company not specified';
          const location = locationElement?.innerText?.trim() || 'Location not specified';
          const salary = salaryElement?.innerText?.trim() || 'Salary not specified';
          const postedDate = dateElement?.getAttribute('datetime') || dateElement?.innerText?.trim() || 'Date not specified';
          const description = descriptionElement?.innerText?.trim() || 'No description available';
          const jobType = typeElement?.innerText?.trim();
          const industry = industryElement?.innerText?.trim();
          const reference = referenceElement?.innerText?.trim();
          
          // Get job URL
          let url = '#';
          if (titleElement) {
            const linkElement = titleElement.closest('a') || titleElement.querySelector('a');
            if (linkElement && linkElement.href) {
              url = new URL(linkElement.href, baseUrl).href;
            } else if (element.getAttribute('href')) {
              url = new URL(element.getAttribute('href') || '', baseUrl).href;
            }
          }
          
          return {
            title,
            company,
            location,
            salary,
            postedDate,
            description,
            jobType,
            industry,
            reference,
            url,
            source: 'CareerJunction'
          };
        } catch (error) {
          console.error('Error processing job element:', error);
          return null;
        }
      }).filter(Boolean);
    }, CONFIG.baseUrl);
    
    // Add jobs to the results
    jobs.push(...(pageJobs.filter(Boolean) as Job[]));
    console.log(`✅ Found ${jobs.length} jobs in total`);
    
    // Return the results
    return NextResponse.json({
      success: true,
      data: jobs,
      meta: {
        total: jobs.length,
        pages: 1, // For now, we're only scraping the first page
        query,
        location,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error during scraping:', error);
    
    // Take a screenshot if possible
    if (page) {
      try {
        const screenshot = await page.screenshot({ encoding: 'base64' });
        console.error('Screenshot of error state:', `data:image/png;base64,${screenshot}`);
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError);
      }
    }
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: 'Scraping failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        ...(process.env.NODE_ENV === 'development' ? { 
          stack: error instanceof Error ? error.stack : undefined 
        } : {})
      },
      { status: 500 }
    );
    
  } finally {
    // Clean up browser instance
    if (browser) {
      try {
        await browser.close();
        console.log('✅ Browser closed successfully');
      } catch (browserError) {
        console.error('Error closing browser:', browserError);
      }
    }
  }
}
