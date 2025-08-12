// Simple test script to check the Afrigter API endpoint
const fetch = require('node-fetch');

async function testAfrigterEndpoint() {
  const url = 'http://localhost:3000/api/afrigter';
  const testPayload = {
    type: 'career-advice',
    question: 'How can I advance my career in software development?',
    experienceLevel: 'mid-level'
  };

  console.log('Sending test request to:', url);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify([...response.headers.entries()]));
    console.log('Response Body:', responseText);

    try {
      const json = JSON.parse(responseText);
      console.log('Parsed JSON Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testAfrigterEndpoint();
