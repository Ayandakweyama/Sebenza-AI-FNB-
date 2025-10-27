import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'indeed';
  
  let browser;
  
  try {
    console.log(`🔍 Testing ${source} scraper...`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    let url = '';
    let selectors: string[] = [];
    
    if (source === 'indeed') {
      url = 'https://za.indeed.com/jobs?q=software+engineer&l=South+Africa';
      selectors = [
        'div.job_seen_beacon',
        'div.jobsearch-SerpJobCard', 
        'div[data-jk]',
        'td.resultContent',
        'div.cardOutline',
        'ul.jobsearch-ResultsList li'
      ];
    } else if (source === 'pnet') {
      url = 'https://www.pnet.co.za/jobs/search-results.html?s=software+engineer&l=South+Africa';
      selectors = [
        'article.job-result',
        'div.job-item',
        'div[data-job-id]',
        'div.result',
        'div.search-result',
        'a[href*="/job/"]'
      ];
    } else if (source === 'careerjunction') {
      url = 'https://www.careerjunction.co.za/jobs?keywords=software+engineer&location=South+Africa';
      selectors = [
        'article.job',
        'div.job-item',
        'div[data-job-id]',
        'div.result-item',
        'li.job-result',
        'a[href*="/jobs/"]'
      ];
    }
    
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Test selectors
    const selectorCounts: Record<string, number> = {};
    for (const selector of selectors) {
      try {
        const count = await page.$$eval(selector, els => els.length);
        selectorCounts[selector] = count;
        console.log(`Selector "${selector}": ${count} elements`);
      } catch (e) {
        selectorCounts[selector] = 0;
        console.log(`Selector "${selector}": Error - ${e}`);
      }
    }
    
    // Get sample HTML
    const bodySnippet = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 1000);
    });
    
    // Try to find any job-related elements
    const anyJobElements = await page.evaluate(() => {
      const elements: string[] = [];
      
      // Find elements with "job" in class name
      document.querySelectorAll('[class*="job" i], [class*="card" i], [class*="result" i]').forEach((el, idx) => {
        if (idx < 5) {
          elements.push(`${el.tagName}.${el.className}`);
        }
      });
      
      return elements;
    });
    
    return NextResponse.json({
      success: true,
      source,
      url,
      pageTitle: title,
      selectorCounts,
      anyJobElements,
      bodySnippet,
      recommendations: getRecommendations(selectorCounts)
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function getRecommendations(counts: Record<string, number>) {
  const nonZero = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([selector, count]) => ({ selector, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    workingSelectors: nonZero,
    suggestion: nonZero.length > 0 
      ? `Use selector: ${nonZero[0].selector}` 
      : 'No working selectors found. Check if page requires login or has anti-bot protection.'
  };
}
