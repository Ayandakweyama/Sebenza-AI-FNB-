# Job Scraper System

Multi-source job scraper that supports Indeed, Pnet, and CareerJunction for South African job postings.

## Features

- **Multi-source scraping**: Scrape from Indeed, Pnet, and CareerJunction simultaneously
- **Deduplication**: Automatically removes duplicate jobs across sources
- **Error handling**: Graceful error handling with detailed logging
- **Request optimization**: Blocks unnecessary resources (images, stylesheets) for faster scraping
- **Anti-bot measures**: Random delays, user agent rotation, request interception

## Architecture

### Scraper Modules

Each job board has its own scraper module in `src/lib/scrapers/`:

- `indeed.ts` - Indeed South Africa scraper
- `pnet.ts` - Pnet scraper
- `careerjunction.ts` - CareerJunction scraper
- `types.ts` - TypeScript interfaces for jobs and results
- `utils.ts` - Shared utilities (auto-scroll, request interception, etc.)

### API Routes

- **`/api/scrape-multi`**: Main endpoint that scrapes from multiple sources in parallel
- **`/api/scrape-careerjunction`**: Legacy CareerJunction-only endpoint (still available)
- **`/api/scrape-jobs`**: Legacy Indeed-only endpoint (still available)

### Frontend Hook

The `useJobScraper` hook in `src/hooks/useJobScraper.ts` provides a React interface:

```typescript
const {
  scrapeJobs,      // Scrape specific sources
  scrapeAll,       // Scrape all sources
  jobs,            // All jobs combined
  jobsBySource,    // Jobs grouped by source
  isLoading,       // Loading state
  error            // Error state
} = useJobScraper({
  onScrapeStart: () => console.log('Starting...'),
  onScrapeComplete: (jobs, source) => console.log('Done!'),
  onError: (error) => console.error(error)
});
```

## Usage

### Basic Usage

```typescript
// Scrape from all sources
const jobs = await scrapeAll({
  query: 'software developer',
  location: 'Cape Town',
  maxPages: 2
});
```

### Scrape Specific Sources

```typescript
// Scrape only from Indeed and Pnet
const jobs = await scrapeJobs({
  query: 'software developer',
  location: 'Johannesburg',
  maxPages: 1,
  sources: ['indeed', 'pnet']
});
```

### API Request

```bash
curl -X POST http://localhost:3000/api/scrape-multi \
  -H "Content-Type: application/json" \
  -d '{
    "query": "software developer",
    "location": "Cape Town",
    "maxPages": 2,
    "sources": ["indeed", "pnet", "careerjunction"]
  }'
```

## Job Data Structure

```typescript
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
  source: 'indeed' | 'pnet' | 'careerjunction';
}
```

## Configuration

All scrapers use consistent Puppeteer configuration from `utils.ts`:

```typescript
const BROWSER_CONFIG = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    // ... more args
  ],
  defaultViewport: { width: 1366, height: 768 },
  ignoreHTTPSErrors: true,
  timeout: 30000
};
```

## Error Handling

- Each scraper returns a `ScraperResult` with success status
- Failed scrapers don't break the entire operation
- Detailed error logging for debugging
- Frontend receives both successful jobs and error messages

## Performance

- **Parallel scraping**: All sources scraped simultaneously
- **Request interception**: Blocks images, stylesheets, fonts
- **Auto-scroll**: Loads dynamic content efficiently
- **Timeout protection**: 5-minute max for multi-source operations
- **Deduplication**: Removes duplicate jobs by URL or title+company

## Limitations

- Max 10 pages per source to prevent timeouts
- Requires Puppeteer (not available in some serverless environments)
- May be blocked by anti-bot measures (CAPTCHA, rate limiting)
- Performance depends on website structure changes

## Troubleshooting

### CAPTCHA Detected
- Use different IP address or VPN
- Reduce `maxPages` to scrape less aggressively
- Add longer delays between requests

### Empty Results
- Check if website structure has changed
- Verify selectors in scraper modules
- Check browser console logs for errors

### Timeout Errors
- Reduce `maxPages`
- Scrape fewer sources at once
- Check internet connection speed

## Future Improvements

- [ ] Add more job boards (LinkedIn, Glassdoor, etc.)
- [ ] Implement proxy rotation
- [ ] Cache results to reduce redundant scraping
- [ ] Add job filtering and ranking
- [ ] Store jobs in database
- [ ] Add rate limiting per source
