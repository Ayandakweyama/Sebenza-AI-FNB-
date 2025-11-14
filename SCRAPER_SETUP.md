# Job Scraper Setup Guide

## 🚨 Current Status

The job scrapers are currently using **sample data** because Puppeteer has browser launch issues in your environment.

## 🔧 To Get Real Job Scraping Working

### Option 1: Fix Puppeteer (Recommended for Production)

The scraper modules are already built for:
- ✅ Indeed South Africa
- ✅ Pnet
- ✅ CareerJunction  
- ✅ LinkedIn

**To fix the "Navigating frame was detached" errors:**

1. **Install Chromium separately:**
```bash
# Windows
choco install chromium

# Or download from: https://www.chromium.org/getting-involved/download-chromium
```

2. **Update BROWSER_CONFIG in `src/lib/scrapers/utils.ts`:**
```typescript
export const BROWSER_CONFIG = {
  headless: true,
  executablePath: 'C:\\Program Files\\Chromium\\Application\\chrome.exe', // Your path
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ],
  defaultViewport: { width: 1366, height: 768 },
  ignoreHTTPSErrors: true
};
```

3. **Switch endpoint in `src/hooks/useJobScraper.ts`:**
```typescript
// Change from:
const endpoint = '/api/scrape-fallback';

// To:
const endpoint = '/api/scrape-multi';
```

### Option 2: Use Adzuna API (Easier Setup)

1. **Get free API keys** from https://developer.adzuna.com/
   - 1000 calls/month free
   - Real jobs from South Africa

2. **Add to `.env` file:**
```bash
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
```

3. **Uncomment Adzuna code** in `src/app/api/scrape-fallback/route.ts` (line 84-158)

4. **Jobs will automatically be real!**

### Option 3: Use RapidAPI (Best for Multiple Sources)

1. **Sign up**: https://rapidapi.com/hub
2. **Subscribe to**: JSearch API or LinkedIn Jobs API
3. **Add to `.env`:**
```bash
RAPIDAPI_KEY=your_rapid_api_key
```

4. **Create new API route** using RapidAPI endpoints

## 🎯 Current Sample Data

The fallback provides 6 sample jobs from:
- 2 from Indeed
- 2 from Pnet
- 1 from CareerJunction
- 1 from LinkedIn

These update dynamically based on search query and location!

## 🔍 Debugging Puppeteer Issues

If you want to debug why Puppeteer is failing:

1. **Run test scraper:**
```bash
node test-scraper-debug.js
```

2. **Check server logs** for:
```
📄 Indeed - Processing page 1/3
   URL: https://za.indeed.com/...
   ✗ Navigation failed: Navigating frame was detached
```

3. **Common issues:**
   - Chrome/Chromium not found
   - Insufficient permissions
   - Windows Defender blocking
   - Multiple browser instances conflict

## 🚀 Production Deployment

For Vercel/Netlify deployment:

**Puppeteer won't work in serverless!** Use one of these instead:

1. **Browserless.io** - Cloud browser service
2. **Adzuna API** - Free tier available
3. **RapidAPI** - Multiple job APIs
4. **Scraperapi.com** - Handles anti-bot for you

## 📊 Current Architecture

```
Frontend (useJobScraper)
    ↓
API Route (/api/scrape-fallback) ← Currently using
    ↓
Sample Jobs (6 jobs)

OR

API Route (/api/scrape-multi)
    ↓
Puppeteer Scrapers (Indeed, Pnet, etc.)
    ↓
Real Jobs (if Puppeteer working)
```

## ✅ What's Working Now

- ✅ Job swipe interface
- ✅ List view
- ✅ Sample jobs display correctly
- ✅ All UI features functional
- ✅ Search by query/location
- ✅ Save/apply tracking

## ❌ What's Not Working

- ❌ Real-time scraping (Puppeteer browser issues)
- ❌ Large number of jobs (only 6 samples)
- ❌ Fresh job postings

## 🎁 Quick Win: Use Adzuna

This is the easiest way to get real jobs working:

1. Get API keys (5 minutes): https://developer.adzuna.com/
2. Add to `.env`
3. Uncomment code in `scrape-fallback/route.ts`
4. Restart server
5. **Real jobs from South Africa!** 🎉

## 📝 Next Steps

1. Choose your approach (Adzuna recommended)
2. Follow setup instructions above
3. Test with a search
4. Enjoy real job data!
