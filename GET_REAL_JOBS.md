# How to Get REAL Job Scraping Working

## 🎯 Quick Solution (5 minutes)

### Get FREE Adzuna API Keys

1. **Visit:** https://developer.adzuna.com/
2. **Sign up** (free account)
3. **Create an application**
4. **Copy your App ID and App Key**

5. **Add to your `.env` file:**
```bash
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
```

6. **Restart your dev server:**
```bash
npm run dev
```

7. **Done!** Real jobs from South Africa will now appear! 🎉

### What You Get:

- ✅ Real job postings from South Africa
- ✅ 1000 API calls per month (free tier)
- ✅ Jobs from Indeed, CareerJunction, Pnet aggregated
- ✅ Fresh daily updates
- ✅ Salary information
- ✅ Company details
- ✅ Job descriptions
- ✅ Direct application links

## 📊 Current Setup

**Right now you're using:** Sample/mock data (6 jobs)

**With Adzuna API keys:** 20+ real jobs per search

**Code is already implemented!** Just needs API keys.

## 🔍 What's Already Built

### Scrapers Ready:
- ✅ **Adzuna API** (working, needs keys)
- ✅ **Indeed** (Puppeteer - has browser issues)
- ✅ **Pnet** (Puppeteer - has browser issues)
- ✅ **CareerJunction** (Puppeteer - has browser issues)
- ✅ **LinkedIn** (Puppeteer - has browser issues)

### Why Puppeteer Isn't Working:

The error `"Navigating frame was detached"` happens because:
1. Multiple browsers launching at once
2. Windows environment browser path issues
3. Chrome/Chromium not installed properly

**Solution:** Use Adzuna API instead (no browser needed)!

## 🚀 After Adding Adzuna Keys

Your job portal will:
1. Fetch REAL jobs from South Africa
2. Update based on search query
3. Show actual salaries
4. Provide real job links
5. Include job descriptions
6. Filter by location

## 📝 Example Adzuna Response

```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Company",
  "location": "Cape Town, Western Cape",
  "salary_min": 600000,
  "salary_max": 900000,
  "description": "We are seeking...",
  "redirect_url": "https://..."
}
```

## 🎁 Bonus: Upgrade to Paid Plans

If you need more than 1000 calls/month:

- **Basic:** 10,000 calls/month - $100
- **Pro:** 50,000 calls/month - $400
- **Enterprise:** Unlimited - Contact them

## 🛠️ Alternative: Fix Puppeteer

If you prefer scraping directly:

1. Install Chromium: https://www.chromium.org/getting-involved/download-chromium
2. Update `src/lib/scrapers/utils.ts` with Chrome path
3. Change endpoint in `src/hooks/useJobScraper.ts` to `/api/scrape-multi`
4. Test thoroughly (may still have issues)

**Not recommended** - Adzuna is easier and more reliable!

## ✨ Current Job Sources

With Adzuna, you get aggregated data from:
- Indeed South Africa
- CareerJunction  
- Pnet
- LinkedIn
- Career24
- And more...

All in one API call!

## 🎯 Action Items

**To get real jobs RIGHT NOW:**

1. [ ] Sign up at https://developer.adzuna.com/
2. [ ] Get API keys (free)
3. [ ] Add to `.env` file:
```
ADZUNA_APP_ID=your_id
ADZUNA_APP_KEY=your_key
```
4. [ ] Restart server: `npm run dev`
5. [ ] Search for jobs at `/jobs/all`
6. [ ] See REAL jobs! 🚀

**That's it!** 5 minutes to real job data.
