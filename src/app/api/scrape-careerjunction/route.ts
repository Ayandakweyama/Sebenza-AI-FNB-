import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { randomInt } from 'crypto';
import type { Browser, Page } from 'puppeteer';

// Define custom type for HTTPResponse since it's not directly exported from puppeteer
interface HTTPResponse {
  status: () => number;
  url: () => string;
  request: () => { resourceType: () => string };
}

// Initialize puppeteer with stealth plugin
puppeteer.use(StealthPlugin());

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
    
    // Initialize browser and page
    let browser: Browser | null = null;
    let page: Page | null = null;
    const jobs: Job[] = [];

    // Launch the browser with configuration
    console.log('🚀 Launching browser...');
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
        response = await page.goto(searchUrl, { 
          waitUntil: CONFIG.navigation.waitUntil,
          timeout: CONFIG.navigation.timeout
        });
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
      
      // Helper function to auto-scroll the page
      const autoScrollPage = async (page: Page) => {
        try {
          await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
              let currentHeight = 0;
              const scrollStep = 100;
              const scrollInterval = 100; // ms
              
              const scrollFn = () => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, scrollStep);
                currentHeight += scrollStep;

                if (currentHeight < scrollHeight - window.innerHeight) {
                  setTimeout(scrollFn, scrollInterval);
                } else {
                  resolve();
                }
              };
              
              scrollFn();
            });
          });
        } catch (error) {
          console.warn('Auto-scroll failed, continuing without it:', error);
        }
      };

      // Calculate total pages to scrape (max 10)
      const maxPagesToScrape = Math.min(Number(validatedMaxPages) || 1, 10);
  
      for (let pageNum = 1; pageNum <= maxPagesToScrape; pageNum++) {
        console.log(`📄 Processing page ${pageNum} of ${maxPagesToScrape}...`);
        
        try {
          // Update URL for pagination if not the first page
          if (pageNum > 1) {
            const pageUrl = `${CONFIG.baseUrl}/jobs?${new URLSearchParams({
              keywords: query.toString(),
              location: location.toString(),
              pagesize: '20',
              page: pageNum.toString(),
            })}`;
            
            console.log(`🔄 Navigating to page ${pageNum}: ${pageUrl}`);
            
            try {
              const navResponse = await page.goto(pageUrl, { 
                waitUntil: CONFIG.navigation.waitUntil,
                timeout: CONFIG.navigation.timeout 
              });
              
              if (!navResponse || navResponse.status() < 200 || navResponse.status() >= 300) {
                console.warn(`Failed to navigate to page ${pageNum}, stopping pagination`);
                break;
              }
              
              // Wait for the page to settle
              await randomDelay(1000, 3000);
            } catch (navError) {
              console.error(`Error navigating to page ${pageNum}:`, navError);
              break;
            }
          }
          
          // Wait for job listings to load with a flexible selector
          try {
            await page.waitForSelector(
              '.job-listing, [data-testid="job-card"], .job-card, .job-item', 
              { 
                timeout: CONFIG.navigation.waitForSelectorTimeout,
                visible: true 
              }
            );
            
            // Scroll to load all jobs (lazy loading)
            await autoScrollPage(page);
            
            // Add a small delay to ensure all content is loaded
            await randomDelay(1000, 2000);
            
          } catch (error) {
            console.warn(`No job listings found on page ${pageNum} or timeout waiting for them`);
            // Take a screenshot for debugging
            if (page) {
              try {
                const screenshot = await page.screenshot({ encoding: 'base64' });
                console.log(`Screenshot of page ${pageNum}:`, `data:image/png;base64,${screenshot}`);
              } catch (screenshotError) {
                console.error('Failed to take screenshot:', screenshotError);
              }
            }
            
            // If we're on the first page and no jobs found, it might be an error
            if (pageNum === 1) {
              throw new Error('No job listings found on the first page. The page structure might have changed.');
            }
            
            // Otherwise, just break the loop as we've reached the end
            break;
          }
          
          // Add debug logging for page content
          const pageContent = await page.content();
          console.log('Page content length:', pageContent.length);
          console.log('Page title:', await page.title());
          
          // Take a screenshot for debugging
          try {
            const screenshot = await page.screenshot({ encoding: 'base64' });
            console.log('Page screenshot (first 100 chars):', `data:image/png;base64,${screenshot.substring(0, 100)}...`);
          } catch (e) {
            console.error('Failed to take screenshot:', e);
          }
          
          // Extract job data from the current page
          const pageJobs = await page.evaluate((baseUrl: string) => {
            // Helper function to get text content with multiple selectors
            const getText = (element: Element, selectors: string[]): string => {
              for (const selector of selectors) {
                try {
                  const el = element.querySelector(selector);
                  if (el && el.textContent && el.textContent.trim()) {
                    return el.textContent.trim();
                  }
                } catch (e) {
                  console.warn(`Error querying selector ${selector}:`, e);
                }
              }
              return '';
            };
            
            // Helper function to get href with multiple selectors
            const getHref = (element: Element, selectors: string[]): string => {
              for (const selector of selectors) {
                try {
                  const el = element.querySelector(selector);
                  if (el) {
                    const href = el.getAttribute('href');
                    if (href) return href;
                  }
                } catch (e) {
                  console.warn(`Error getting href with selector ${selector}:`, e);
                }
              }
              return '';
            };
            
            // Log the document body for debugging
            console.log('Document body length:', document.body?.innerText?.length || 0);
            
            // Try different selectors to find job elements - updated with more specific selectors
            const selectors = [
              'div.job-card',
              'div.job-listing',
              'article.job',
              'div.job',
              'li.job',
              'div[data-testid="job-card"]',
              'div[class*="job-card"]',
              'div[class*="job-listing"]',
              'div[class*="job-item"]',
              'div[class*="job-"]',
              'div[class*="listing"]',
              'article[class*="job"]',
              'li[class*="job"]',
              'div[class*="result"]',
              'div[class*="item"]',
              'div.card', // More generic selectors as fallback
              'div.list-item'
            ];
            
            let jobElements: Element[] = [];
            
            // First, try to find job container elements
            const containerSelectors = [
              'div#search-results',
              'div.job-listings',
              'div.jobs-container',
              'div.search-results',
              'div[role="list"]'
            ];
            
            // Look for container elements first
            let container: Element | null = null;
            for (const selector of containerSelectors) {
              try {
                const el = document.querySelector(selector);
                if (el) {
                  console.log(`Found container with selector: ${selector}`);
                  container = el;
                  break;
                }
              } catch (e) {
                console.warn(`Error with container selector ${selector}:`, e);
              }
            }
            
            // If we found a container, search within it
            const searchRoot = container || document;
            
            // Try each selector until we find some job elements
            for (const selector of selectors) {
              try {
                const elements = Array.from(searchRoot.querySelectorAll(selector));
                console.log(`Found ${elements.length} elements with selector: ${selector}`);
                
                // If we found elements and they look like job listings (have title and company)
                const filteredElements = elements.filter(el => {
                  const hasTitle = Boolean(getText(el, ['h2', 'h3', 'h4', '.title', '.job-title', '[data-testid*="title"]']));
                  const hasCompany = Boolean(getText(el, ['.company', '.employer', '[data-testid*="company"]']));
                  return hasTitle || hasCompany; // At least one of them should be present
                });
                
                if (filteredElements.length > 0) {
                  console.log(`Found ${filteredElements.length} valid job elements with selector: ${selector}`);
                  jobElements = filteredElements;
                  break;
                }
              } catch (e) {
                console.warn(`Error with selector ${selector}:`, e);
              }
            }
            
            if (!jobElements || jobElements.length === 0) {
              console.warn('No job elements found with any selector');
              return [];
            }
            
            const results = [];
            
            for (const jobElement of jobElements) {
              try {
                // Extract job data with fallback selectors
                const title = getText(jobElement, [
                  'h2.job-title a', 'h3.job-title a', 'h2 a', 'h3 a',
                  '[data-testid="job-title"]', '.job-title', '.title', 'h2', 'h3'
                ]);
                
                if (!title) {
                  console.warn('Skipping job element with no title');
                  continue;
                }
                
                const company = getText(jobElement, [
                  '.company', '.company-name', '.employer',
                  '[data-testid="company-name"]', '.org', '.company-name', 'span.company'
                ]);
                
                const location = getText(jobElement, [
                  '.location', '.job-location', '.area',
                  '[data-testid="job-location"]', '.loc', '.job-area', 'span.location'
                ]);
                
                const salary = getText(jobElement, [
                  '.salary', '.job-salary', '.remuneration',
                  '[data-testid="job-salary"]', '.package', '.job-package', 'span.salary'
                ]);
                
                const postedDate = getText(jobElement, [
                  '.date-posted', '.posted-date', '.date',
                  '[data-testid="job-date"]', '.timeago', '.posted', 'span.date'
                ]);
                
                const jobType = getText(jobElement, ['.job-type', '.type', '.employment-type', 'span.type']);
                const industry = getText(jobElement, ['.industry', '.sector', '.job-category', 'span.industry']);
                const reference = getText(jobElement, ['.reference', '.job-ref', 'span.reference']);
                
                // Construct job URL
                const href = getHref(jobElement, [
                  'a.job-title', 'a[href*="/jobs/"]', 'a[href*="/job/"]',
                  'a[href*="careerjunction"]', 'a[data-testid="job-link"]', 'a'
                ]);
                
                let url = '#';
                if (href) {
                  try {
                    url = new URL(href, baseUrl).href;
                  } catch (e) {
                    url = href.startsWith('/') ? `${baseUrl}${href}` : href;
                  }
                }
                
                results.push({
                  title: title || 'No title',
                  company: company || 'Company not specified',
                  location: location || 'Location not specified',
                  salary: salary || 'Salary not specified',
                  postedDate: postedDate || 'Date not specified',
                  description: '', // Will be filled in detailed view
                  jobType: jobType || undefined,
                  industry: industry || undefined,
                  reference: reference || undefined,
                  url: url,
                  source: 'CareerJunction'
                });
                
              } catch (error) {
                console.warn('Error parsing job element:', error);
                // Continue with the next job element
              }
            }
            
            return results;
          }, CONFIG.baseUrl);
          
          const pageJobsCount = pageJobs?.length || 0;
          console.log(`✅ Processed ${pageJobsCount} jobs on page ${pageNum}`);
          
          // Add the jobs from this page to our results
          jobs.push(...pageJobs);
          
          if (pageJobs.length === 0 && pageNum === 1) {
            // If no jobs found on first page, it might be an error
            const pageContent = await page.content().catch(() => '');
            console.warn('No jobs found on first page. Page content length:', pageContent.length);
            
            if (pageContent.includes('no jobs found') || 
                pageContent.includes('no results') ||
                pageContent.length < 1000) { // Very small page might be an error page
              throw new Error('No jobs found for the given search criteria');
            }
          }
          
          // Continue to next page if we have jobs
          if (pageJobs.length > 0) {
            // Add random delay between pages to avoid rate limiting
            if (pageNum < maxPagesToScrape) {
              const delay = randomInt(
                CONFIG.navigation.delayBetweenPages.min, 
                CONFIG.navigation.delayBetweenPages.max
              );
              console.log(`⏳ Waiting ${delay}ms before next page...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            console.log('No jobs found on this page, stopping pagination');
            break;
          }
          
        } catch (pageError) {
          console.error(`❌ Error processing page ${pageNum}:`, pageError);
          
          // If it's the first page, rethrow the error to fail fast
          if (pageNum === 1) {
            throw new Error(`Failed to process the first page: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
          }
          
          // Otherwise, log the error and break the loop
          console.warn(`Skipping to next page due to error on page ${pageNum}`);
          break;
        }
      }

      // Return the results
      return NextResponse.json({
        success: true,
        data: jobs,
        meta: {
          total: jobs.length,
          pages: Math.ceil(jobs.length / 20), // Assuming 20 jobs per page
          query,
          location,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error: unknown) {
      log('❌ Error during scraping:', { 
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
          error: 'Failed to scrape CareerJunction',
          message: errorMessage,
          requestId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'X-Error-Type': 'ScraperError'
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
      log('===== CLEANUP COMPLETE =====');
    }
  } catch (outerError) {
    // Handle any errors that occur outside the main try-catch
    console.error('Outer error:', outerError);
    const errorMessage = outerError instanceof Error ? outerError.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape CareerJunction',
        message: errorMessage,
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    // Log the end of the request
    log('🔹 Request completed at:', new Date().toISOString());
  }
}