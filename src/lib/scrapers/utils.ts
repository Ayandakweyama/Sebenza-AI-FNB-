import { randomInt } from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { Browser, Page } from 'puppeteer';

function isServerEnvironment(): boolean {
  return !!(
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RENDER ||
    process.env.FLY_APP_NAME ||
    process.env.VERCEL ||
    process.env.DOCKER_CONTAINER ||
    (process.env.NODE_ENV === 'production' && !process.env.DISPLAY)
  );
}

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
  // Create a new browser instance with guaranteed unique userDataDir
  const puppeteer = await import('puppeteer');
  const isServer = isServerEnvironment();
  
  let userDataDir: string;
  let uniqueDir: string;
  let attempts = 0;
  
  do {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
    uniqueDir = `puppeteer_dev_chrome_profile-${timestamp}-${randomId}`;
    userDataDir = path.join(os.tmpdir(), uniqueDir);
    attempts++;
  } while (fs.existsSync(userDataDir) && attempts < 10); // Ensure directory doesn't exist
  
  console.log(`🔧 Creating browser (${isServer ? 'server' : 'local'}) with userDataDir: ${userDataDir}`);
  
  const config = {
    ...(isServer ? SERVER_BROWSER_CONFIG : FAST_BROWSER_CONFIG),
    userDataDir
  };
  
  try {
    const browser = await puppeteer.default.launch(config);
    console.log(`✅ Browser created successfully with unique profile: ${uniqueDir}`);
    return browser;
  } catch (error) {
    console.error(`❌ Failed to create browser with profile ${uniqueDir}:`, error);
    throw error;
  }
}

export async function returnBrowserToPool(browser: Browser) {
  // Since each browser has a unique userDataDir, don't reuse them
  // Just close the browser properly with error handling
  if (browser && browser.isConnected()) {
    try {
      console.log('🧹 Closing browser...');
      await browser.close();
      console.log('✅ Browser closed successfully');
    } catch (error) {
      console.warn('⚠️ Error closing browser (this is usually safe to ignore):', error);
      // Don't rethrow - browser cleanup errors are usually not critical
    }
  } else {
    console.log('ℹ️ Browser already closed or not connected');
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
    // Removed --disable-javascript - scrapers need JS
    '--no-first-run',
    '--memory-pressure-off'
  ],
  defaultViewport: { width: 1024, height: 600 },
  ignoreHTTPSErrors: true,
  timeout: 15000,
  protocolTimeout: 120000 // 2 minutes for protocol operations
};

// Server/Railway-safe config with container-compatible args
export const SERVER_BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process',
    '--no-zygote',
    '--disable-extensions',
    '--disable-plugins',
    '--no-first-run',
    '--memory-pressure-off',
    '--disable-blink-features=AutomationControlled',
  ],
  defaultViewport: { width: 1366, height: 768 },
  ignoreHTTPSErrors: true,
  timeout: 30000,
  protocolTimeout: 180000 // 3 minutes for server environments
};
