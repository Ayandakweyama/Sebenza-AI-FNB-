import { scrapeIndeed } from './src/lib/scrapers/index.js';

async function main() {
  console.log('Starting Indeed scraper test...');
  const r = await scrapeIndeed({query:'software developer', location:'Johannesburg', maxPages:1});
  console.log('Result:', JSON.stringify({success:r.success, count:r.count, source:r.source, error:r.error, firstJob:r.jobs?.[0]?.title}, null, 2));
  if (r.jobs?.length > 0) {
    console.log('First 3 jobs:', r.jobs.slice(0,3).map(j => ({title:j.title, company:j.company, source:j.source})));
  }
  process.exit(0);
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
