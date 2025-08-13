const fetch = require('node-fetch');

async function testScraper() {
  const response = await fetch('http://localhost:3003/api/scrape-careerjunction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'software engineer',
      location: 'South Africa',
      maxPages: 1
    })
  });

  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));
}

testScraper().catch(console.error);
