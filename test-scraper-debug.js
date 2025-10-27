const puppeteer = require('puppeteer');

async function testIndeed() {
  console.log('🔍 Testing Indeed scraper...');
  const browser = await puppeteer.launch({ 
    headless: false,  // Set to false to see browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = 'https://za.indeed.com/jobs?q=software+engineer&l=South+Africa';
    console.log('Navigating to:', url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'indeed-debug.png' });
    console.log('Screenshot saved to indeed-debug.png');
    
    // Try different selectors
    const selectors = [
      'div.job_seen_beacon',
      'div.jobsearch-SerpJobCard',
      'div[data-jk]',
      'div.job-card',
      'article',
      '[class*="job"]'
    ];
    
    for (const selector of selectors) {
      const count = await page.$$eval(selector, els => els.length);
      console.log(`Selector "${selector}": ${count} elements found`);
    }
    
    // Get page HTML snippet
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('\nPage HTML (first 500 chars):', bodyHTML);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

async function testPnet() {
  console.log('\n🔍 Testing Pnet scraper...');
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = 'https://www.pnet.co.za/jobs/search-results.html?s=software+engineer&l=South+Africa&p=1';
    console.log('Navigating to:', url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'pnet-debug.png' });
    console.log('Screenshot saved to pnet-debug.png');
    
    const selectors = [
      'article.job-result',
      'div.job-item',
      'div[data-job-id]',
      'div.result',
      '[class*="job"]',
      'article'
    ];
    
    for (const selector of selectors) {
      const count = await page.$$eval(selector, els => els.length);
      console.log(`Selector "${selector}": ${count} elements found`);
    }
    
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('\nPage HTML (first 500 chars):', bodyHTML);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

async function testCareerJunction() {
  console.log('\n🔍 Testing CareerJunction scraper...');
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = 'https://www.careerjunction.co.za/jobs?keywords=software+engineer&location=South+Africa';
    console.log('Navigating to:', url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'careerjunction-debug.png' });
    console.log('Screenshot saved to careerjunction-debug.png');
    
    const selectors = [
      'article.job',
      'div.job-item',
      'div[data-job-id]',
      'div.result-item',
      'li.job-result',
      '[class*="job"]',
      'article'
    ];
    
    for (const selector of selectors) {
      const count = await page.$$eval(selector, els => els.length);
      console.log(`Selector "${selector}": ${count} elements found`);
    }
    
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('\nPage HTML (first 500 chars):', bodyHTML);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Run all tests
(async () => {
  console.log('Starting scraper debugging tests...\n');
  await testIndeed();
  await testPnet();
  await testCareerJunction();
  console.log('\n✅ All tests complete!');
})();
