import { randomInt } from 'crypto';
import type { Browser, Page } from 'puppeteer';

export const randomDelay = (min: number, max: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, randomInt(min, max)));

// Faster delays for performance
export const fastDelay = (min: number = 500, max: number = 1500): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, randomInt(min, max)));

export async function autoScroll(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        let scrollAttempts = 0;
        const maxAttempts = 50; // Prevent infinite scrolling
        
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrollAttempts++;

          if (totalHeight >= scrollHeight || scrollAttempts >= maxAttempts) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  } catch (error) {
    console.warn('Auto-scroll failed, continuing anyway:', error);
  }
}

export async function configureRequestInterception(page: Page, aggressive: boolean = false) {
  try {
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      // Block unnecessary resources for faster loading
      const blockedTypes = aggressive 
        ? ['image', 'stylesheet', 'font', 'media', 'imageset', 'manifest', 'other']
        : ['image', 'stylesheet', 'font', 'media', 'imageset', 'manifest'];
      
      // Block tracking and analytics
      const blockedDomains = [
        'google-analytics.com',
        'googletagmanager.com',
        'facebook.com',
        'doubleclick.net',
        'googlesyndication.com'
      ];
      
      if (blockedTypes.includes(resourceType) || 
          blockedDomains.some(domain => url.includes(domain))) {
        request.abort().catch(() => {});
      } else {
        request.continue().catch(() => {});
      }
    });
  } catch (error) {
    console.warn('Could not set up request interception:', error);
  }
}

// Browser pool for reusing instances
let browserPool: Browser[] = [];
const MAX_POOL_SIZE = 3;

export async function getBrowserFromPool(): Promise<Browser> {
  if (browserPool.length > 0) {
    return browserPool.pop()!;
  }
  
  const puppeteer = await import('puppeteer');
  return await puppeteer.default.launch(FAST_BROWSER_CONFIG);
}

export async function returnBrowserToPool(browser: Browser) {
  if (browserPool.length < MAX_POOL_SIZE) {
    browserPool.push(browser);
  } else {
    await browser.close().catch(() => {});
  }
}

// Cleanup pool on exit
process.on('exit', () => {
  browserPool.forEach(browser => browser.close().catch(() => {}));
});

export const BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-images', // Skip loading images for faster scraping
    '--disable-javascript', // We'll enable only when needed
    '--disable-default-apps',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--memory-pressure-off',
    '--max_old_space_size=4096'
  ],
  defaultViewport: { width: 1280, height: 720 }, // Smaller viewport for speed
  ignoreHTTPSErrors: true,
  timeout: 30000 // Reduced timeout
};

// Lightweight config for faster scraping
export const FAST_BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-images',
    '--disable-css',
    '--disable-plugins',
    '--disable-extensions',
    '--disable-javascript',
    '--no-first-run',
    '--memory-pressure-off'
  ],
  defaultViewport: { width: 1024, height: 600 },
  ignoreHTTPSErrors: true,
  timeout: 15000
};
