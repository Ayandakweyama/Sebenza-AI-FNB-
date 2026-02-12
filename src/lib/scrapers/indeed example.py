import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, TypedDict
from urllib.parse import urlencode
import time
import random
from datetime import datetime

class Job(TypedDict):
    title: str
    company: str
    location: str
    salary: str
    postedDate: str
    description: str
    url: str
    jobType: str
    source: str

class ScraperConfig(TypedDict):
    query: str
    location: str
    maxPages: Optional[int]

class ScraperResult(TypedDict):
    jobs: List[Job]
    success: bool
    source: str
    count: int
    error: Optional[str]

def fast_delay(min_ms: int = 1000, max_ms: int = 2000):
    """Add a random delay between requests"""
    delay = random.uniform(min_ms / 1000, max_ms / 1000)
    time.sleep(delay)

def scrape_indeed(config: ScraperConfig) -> ScraperResult:
    """
    Scrape Indeed job listings using Beautiful Soup
    
    Args:
        config: Dictionary containing query, location, and optional maxPages
    
    Returns:
        ScraperResult with jobs list and metadata
    """
    query = config['query']
    location = config['location']
    max_pages = config.get('maxPages', 3)
    
    start_time = time.time()
    
    try:
        print(f'🔍 Starting Indeed scraper for "{query}" in "{location}"')
        
        # Setup session with headers
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        all_jobs: List[Job] = []
        
        for page_num in range(max_pages):
            start = page_num * 10
            params = {
                'q': query,
                'l': location,
                'start': start
            }
            search_url = f"https://za.indeed.com/jobs?{urlencode(params)}"
            
            print(f'📄 Indeed - Processing page {page_num + 1}/{max_pages}')
            print(f'   URL: {search_url}')
            
            try:
                page_start_time = time.time()
                response = session.get(search_url, timeout=60)
                response.raise_for_status()
                
                elapsed = (time.time() - page_start_time) * 1000
                print(f'   ✓ Page loaded in {elapsed:.0f}ms')
                
            except requests.RequestException as nav_error:
                print(f'   ✗ Navigation failed: {nav_error}')
                raise nav_error
            
            # Add delay to mimic scrolling
            fast_delay(1000, 2000)
            
            # Parse HTML with Beautiful Soup
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Debug: Check what selectors are available
            debug_selectors = {
                'div.job_seen_beacon': len(soup.select('div.job_seen_beacon')),
                'div.jobsearch-SerpJobCard': len(soup.select('div.jobsearch-SerpJobCard')),
                'div[data-jk]': len(soup.select('div[data-jk]')),
                'article': len(soup.select('article')),
                'div[class*="job"]': len(soup.select('div[class*="job"]')),
            }
            print(f'📊 Indeed page {page_num + 1} - Available selectors: {debug_selectors}')
            
            extract_start_time = time.time()
            jobs = extract_jobs(soup)
            
            elapsed = (time.time() - extract_start_time) * 1000
            print(f'✅ Indeed - Found {len(jobs)} jobs on page {page_num + 1} (extraction took {elapsed:.0f}ms)')
            
            all_jobs.extend(jobs)
            
            if page_num < max_pages - 1:
                fast_delay(1500, 3000)
        
        total_time = (time.time() - start_time) * 1000
        print(f'🎉 Indeed scraper completed in {total_time:.0f}ms - Total jobs: {len(all_jobs)}')
        
        return {
            'jobs': all_jobs,
            'success': True,
            'source': 'indeed',
            'count': len(all_jobs),
            'error': None
        }
        
    except Exception as error:
        print(f'❌ Indeed scraper error: {error}')
        return {
            'jobs': [],
            'success': False,
            'error': str(error),
            'source': 'indeed',
            'count': 0
        }

def extract_jobs(soup: BeautifulSoup) -> List[Job]:
    """
    Extract job listings from Indeed page HTML
    
    Args:
        soup: BeautifulSoup object of the page
    
    Returns:
        List of Job dictionaries
    """
    # Try multiple selectors to find job elements
    job_elements = soup.select('div.job_seen_beacon, div.jobsearch-SerpJobCard, div[data-jk], div.slider_container div.slider_item, table.jobsTable tr')
    
    extracted_jobs: List[Job] = []
    
    for element in job_elements:
        try:
            # Enhanced title extraction with more selectors
            title_element = element.select_one('h2.jobTitle a, h2.jobTitle span, a[data-jk] span[title], h2 a span[title], .jobTitle a')
            if title_element:
                title = title_element.get_text(strip=True) or title_element.get('title', '').strip()
            else:
                title = ''
            
            # Enhanced company extraction
            company_element = element.select_one('span[data-testid="company-name"], span.companyName, a[data-testid="company-name"], .companyName a')
            company = company_element.get_text(strip=True) if company_element else ''
            
            # Enhanced location extraction
            location_element = element.select_one('div[data-testid="text-location"], div.companyLocation, .companyLocation')
            location = location_element.get_text(strip=True) if location_element else ''
            
            # Enhanced salary extraction
            salary_element = element.select_one('div.salary-snippet, div[data-testid="attribute_snippet_testid"], .salaryText, span.salaryText')
            salary = salary_element.get_text(strip=True) if salary_element else 'Not specified'
            
            # Enhanced date extraction
            date_element = element.select_one('span.date, span[data-testid="myJobsStateDate"], .date')
            posted_date = date_element.get_text(strip=True) if date_element else 'Recently'
            
            # Enhanced description extraction
            snippet_element = element.select_one('div.job-snippet, div[class*="snippet"], .summary, div.jobsearch-jobDescriptionText')
            description = snippet_element.get_text(strip=True) if snippet_element else ''
            
            # Enhanced URL extraction
            link_element = element.select_one('a[data-jk], h2.jobTitle a, .jobTitle a, a[href*="/viewjob"]')
            if link_element:
                href = link_element.get('href', '')
                url = href if href.startswith('http') else f'https://za.indeed.com{href}'
            else:
                url = ''
            
            # Enhanced job type extraction
            job_type_element = element.select_one('div[data-testid="attribute_snippet_testid"], div.metadata, .jobTypeLabel')
            job_type_text = job_type_element.get_text(strip=True).lower() if job_type_element else ''
            
            if 'full-time' in job_type_text:
                job_type = 'Full-time'
            elif 'part-time' in job_type_text:
                job_type = 'Part-time'
            elif 'contract' in job_type_text:
                job_type = 'Contract'
            elif 'temporary' in job_type_text:
                job_type = 'Temporary'
            else:
                job_type = 'Full-time'
            
            if title and company:
                extracted_jobs.append({
                    'title': title,
                    'company': company,
                    'location': location,
                    'salary': salary,
                    'postedDate': posted_date,
                    'description': description,
                    'url': url,
                    'jobType': job_type,
                    'source': 'indeed'
                })
                
        except Exception as error:
            print(f'⚠️ Error extracting job: {error}')
            continue
    
    return extracted_jobs


# Example usage
if __name__ == '__main__':
    config: ScraperConfig = {
        'query': 'Python Developer',
        'location': 'Cape Town',
        'maxPages': 3
    }
    
    result = scrape_indeed(config)
    
    print(f'\n{"="*50}')
    print(f'Success: {result["success"]}')
    print(f'Total jobs found: {result["count"]}')
    
    if result['jobs']:
        print(f'\nFirst few jobs:')
        for i, job in enumerate(result['jobs'][:3], 1):
            print(f'\n{i}. {job["title"]}')
            print(f'   Company: {job["company"]}')
            print(f'   Location: {job["location"]}')
            print(f'   Salary: {job["salary"]}')
            print(f'   Posted: {job["postedDate"]}')
```

**Key differences from Puppeteer:**

1. **No browser pool** - Beautiful Soup works with static HTML, so no browser management needed
2. **requests.Session** - Replaces Puppeteer's browser instance for making HTTP requests
3. **No auto-scroll** - Beautiful Soup gets the complete HTML immediately, no need to scroll
4. **Simpler and faster** - Static HTML parsing is much faster than browser automation
5. **No request interception** - Not needed since we're making direct HTTP requests

**Requirements** (add to `requirements.txt`):
```
requests>=2.31.0
beautifulsoup4>=4.12.0
lxml>=4.9.0