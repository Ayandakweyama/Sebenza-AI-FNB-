import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { randomInt } from 'crypto';
import type { Browser, Page } from 'puppeteer';

// Define custom type for HTTPResponse since it's not directly exported from puppeteer
interface HTTPResponse {
  status: () => number;
  url: () => string;
  request: () => { resourceType: () => string };
}

// Initialize puppeteer with stealth plugin
// puppeteer.use(StealthPlugin());

// Define types for request and response handlers
type RequestHandler = (req: any) => void;
type ResponseHandler = (res: any) => void;
type ConsoleMessageHandler = (msg: any) => void;

// Define the Job interface with all required and optional fields
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

// Helper function to add random delays
const randomDelay = (min: number, max: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, randomInt(min, max)));

// Configure request interception for the page
async function configureRequestInterception(page: any) {
  await page.setRequestInterception(true);
  
  const handleRequest = async (request: any) => {
    try {
      const resourceType = request.resourceType();
      // Block images, styles, fonts, and other unnecessary resources
      if (['image', 'stylesheet', 'font', 'media', 'imageset', 'manifest', 'other'].includes(resourceType)) {
        await request.abort();
      } else {
        await request.continue();
      }
    } catch (error) {
      console.error('Error in request interception:', error);
      await request.continue();
    }
  };
  
  page.on('request', handleRequest);
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

// Extend the Window interface to match the DOM type
declare global {
  interface Window {
    scrollBy: {
      (options?: ScrollToOptions): void;
      (x: number, y: number): void;
    };
  }
}

export async function POST(request: Request) {
  // Add request ID for tracking
  const requestId = Math.random().toString(36).substring(2, 9);
  const log = (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] [${requestId}] ${message}`, data || '');
  };
  
  log('🔍 ===== CAREER JUNCTION SCRAPER STARTED =====');
  
  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
      log('Request body:', requestBody);
    } catch (e) {
      log('Error parsing request body:', e);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { query, location, maxPages = 1 } = requestBody;
    
    if (!query || !location) {
      log('Missing required parameters', { query, location });
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: query and location are required' },
        { status: 400 }
      );
    }
    
    // Log the start of the request
    log('🔹 Request received at:', new Date().toISOString());
    log('🔹 Request URL:', request.url);
    log('🔹 Process environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH ? 'Set' : 'Not set',
      NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG
    });
    
    // Validate maxPages
    const validatedMaxPages = Math.min(Math.max(1, Number(maxPages) || 1), 10); // Limit to 10 pages max
    
    log('Starting scraper with parameters:', { query, location, maxPages: validatedMaxPages });
    console.log(`📝 Received request with query: "${query}", location: "${location}", maxPages: ${validatedMaxPages}`);
    
    // Check if Puppeteer is available
    try {
      log('🔍 Checking Puppeteer availability...');
      // Try to access puppeteer directly
      if (puppeteer && typeof puppeteer.launch === 'function') {
        log('✅ Puppeteer is available');
      } else {
        throw new Error('Puppeteer launch function not found');
      }
    } catch (e) {
      log('❌ Puppeteer not available:', e instanceof Error ? e.message : e);
      throw new Error('Puppeteer is not properly installed. Please run: npm install puppeteer');
    }
    
    // Initialize browser and page
    let browser: Browser | null = null;
    let page: Page | null = null;
    const jobs: Job[] = [];
    try {
      // Convert headless to boolean if it's 'new'
      const launchOptions = {
        ...CONFIG.browser,
        headless: CONFIG.browser.headless === 'new' ? true : CONFIG.browser.headless
      };
      browser = await puppeteer.launch(launchOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to launch browser:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Browser initialization failed',
          message: `Failed to launch browser: ${errorMessage}`,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    try {
      if (!browser) throw new Error('Browser instance is null');
      
      // Set up browser error handling
      browser.on('disconnected', () => {
        console.log('Browser was disconnected');
      });
      
      // Create a new page
      page = await browser.newPage();
      
      // Configure page settings
      await page.setDefaultNavigationTimeout(CONFIG.navigation.timeout);
      // Set default timeout and viewport
      await page.setDefaultTimeout(30000); // 30 seconds
      await page.setViewport(CONFIG.browser.defaultViewport);
      
      // Configure request interception
      await configureRequestInterception(page);
      
      // Log failed requests
      page.on('requestfailed', (request) => {
        const failure = request.failure();
        console.warn(`❌ Request failed: ${request.url()} - ${failure?.errorText || 'Unknown error'}`);
      });
      
      // Set up console logging with proper error handling
      const handleConsoleMessage = async (msg: any) => {
        try {
          const type = msg.type();
          const text = await Promise.resolve(msg.text());
          
          switch (type) {
            case 'error':
              console.error(`PAGE ERROR: ${text}`);
              break;
            case 'warning':
              console.warn(`PAGE WARNING: ${text}`);
              break;
            default:
              console.log(`PAGE LOG [${type}]: ${text}`);
          }
        } catch (error) {
          console.error('Error handling console message:', error);
        }
      };
      
      page.on('console', handleConsoleMessage);
      
    // Build search URL
      const searchParams = new URLSearchParams({
        keywords: query.toString(),
        location: location.toString(),
        pagesize: '20',
        page: '1',
      });
      
      const searchUrl = `${CONFIG.baseUrl}/jobs?${searchParams.toString()}`;
      console.log(`🌐 Navigating to: ${searchUrl}`);
      
      // Navigate to the search page with error handling
      console.log('🔄 Navigating to search page...');
      let response: HTTPResponse | null = null;
      
      try {
        // Try navigation with multiple attempts
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            attempts++;
            log(`Navigation attempt ${attempts}/${maxAttempts}`);
            
            response = await page.goto(searchUrl, { 
              waitUntil: CONFIG.navigation.waitUntil,
              timeout: CONFIG.navigation.timeout
            });
            
            // If we get here, navigation was successful
            break;
            
          } catch (navError) {
            const errorMessage = navError instanceof Error ? navError.message : 'Unknown navigation error';
            log(`Navigation attempt ${attempts} failed:`, errorMessage);
            
            if (attempts >= maxAttempts) {
              throw new Error(`Failed to navigate after ${maxAttempts} attempts: ${errorMessage}`);
            }
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Navigation error:', error);
        
        // Take a screenshot for debugging
        if (page) {
          try {
            const screenshot = await page.screenshot({ encoding: 'base64' });
            console.log('Screenshot of the page at time of error:', `data:image/png;base64,${screenshot}`);
          } catch (screenshotError) {
            console.error('Failed to take screenshot:', screenshotError);
          }
        }
        
        throw new Error(`Failed to navigate to search page: ${errorMessage}`);
      }
      
      // Process the response
      if (!response) {
        throw new Error('No response received from the server');
      }
      
      const status = response.status();
      console.log(`Response status: ${status}`);
      
      // Check for error status codes
      if (status < 200 || status >= 300) {
        throw new Error(`HTTP error! Status: ${status}`);
      }
      
      // Check for CAPTCHA or error pages
      const pageTitle = await page.title().catch(() => 'No title');
      const pageContent = await page.content().catch(() => '');
      
      console.log(`📄 Page title: ${pageTitle}`);
      
      if (pageTitle.includes('Access Denied') || 
          pageTitle.includes('Security Check') ||
          pageContent.includes('captcha') ||
          pageContent.includes('unusual traffic')) {
            
        let screenshot = '';
        if (page) {
          try {
            screenshot = await page.screenshot({ encoding: 'base64' });
          } catch (e) {
            console.error('Failed to take screenshot:', e);
          }
        }
        
        console.error('🔒 Access denied or CAPTCHA detected:', {
          title: pageTitle,
          url: page?.url() || 'unknown',
          screenshot: screenshot ? 'Screenshot available in logs' : 'No screenshot available'
        });
        
        throw new Error('Access denied or CAPTCHA detected. Please try again later or use a different IP address.');
      }

      // Handle cookie consent if it appears
      try {
        const cookieButton = await page.waitForSelector(
          '#cookie-consent-accept-all, button[data-testid="cookie-banner-accept-all"], button:has-text("Accept All")', 
          { timeout: 5000 }
        );
        
        if (cookieButton) {
          console.log('Found cookie consent banner, accepting...');
          await cookieButton.click().catch((e: Error) => console.warn('Error clicking cookie button:', e));
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for any animations
        }
      } catch (e) {
        console.log('No cookie consent banner found or could not be interacted with');
      }
      
      // SIMPLE TEST: Just try to find any jobs on the page
      console.log('🔍 ===== SIMPLE JOB SEARCH TEST =====');
      
      const simpleJobs = await page.evaluate((baseUrl: string) => {
        // Look for any links that might be job links
        const jobLinks = Array.from(document.querySelectorAll('a[href*="/job/"], a[href*="/jobs/"], a[href*="careerjunction"]'));
        console.log(`Found ${jobLinks.length} potential job links`);
        
        // Try to find job titles from various sources
        const titles = [];
        
        // Look for h1, h2, h3 tags
        document.querySelectorAll('h1, h2, h3, h4').forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 5 && text.length < 100) {
            titles.push(text);
          }
        });
        
        // Look for elements with job-related classes
        document.querySelectorAll('.job-title, .title, .position').forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 5) {
            titles.push(text);
          }
        });
        
        console.log(`Found ${titles.length} potential job titles`);
        
        // Return basic information
        return {
          jobLinks: jobLinks.length,
          titles: titles.slice(0, 5), // First 5 titles
          pageTextLength: document.body?.innerText?.length || 0,
          hasJobsSection: !!document.querySelector('[data-testid*="job"], .job, .vacancy, .position')
        };
      }, CONFIG.baseUrl);
      
      console.log('Simple job search results:', simpleJobs);
      
      // Return test results
      return NextResponse.json({
        success: true,
        test: true,
        message: 'Simple test completed',
        data: simpleJobs,
        pageTitle,
        pageUrl: page?.url(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error: unknown) {
      log('❌ Error during debugging:', { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error.cause ? { cause: error.cause } : {})
        } : error,
        timestamp: new Date().toISOString()
      });
      
      // Log additional Puppeteer error details if available
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { status?: number, url?: string } };
        log('Puppeteer response error:', {
          status: responseError.response?.status,
          url: responseError.response?.url
        });
      }
      
      // Prepare error response
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      log('Sending error response', { errorMessage });

      // Take a screenshot if possible
      if (page) {
        try {
          const screenshot = await page.screenshot({ encoding: 'base64' });
          console.log('Error screenshot captured:', `data:image/png;base64,${screenshot.substring(0, 100)}...`);
        } catch (screenshotError) {
          console.error('Failed to take error screenshot:', screenshotError);
        }
      }
      
      // Return error response
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to debug CareerJunction',
          message: errorMessage,
          requestId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'X-Error-Type': 'DebugError'
          }
        }
      );
    } finally {
      // Cleanup resources
      const cleanup = async () => {
        if (page) {
          try {
            await page.close();
            log('Page closed successfully');
          } catch (e) {
            log('Error closing page:', e);
          }
        }
        
        if (browser) {
          try {
            await browser.close();
            log('Browser closed successfully');
          } catch (e) {
            log('Error closing browser:', e);
          }
        }
      };
      
      await cleanup();
      log('===== DEBUG CLEANUP COMPLETE =====');
    }
  } catch (outerError) {
    // Handle any errors that occur outside the main try-catch
    console.error('Outer error:', outerError);
    const errorMessage = outerError instanceof Error ? outerError.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to debug CareerJunction',
        message: errorMessage,
        requestId: 'unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    // Log the end of the request
    log('🔹 Debug request completed at:', new Date().toISOString());
  }
}