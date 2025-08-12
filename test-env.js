// Simple script to test environment variables
console.log('Environment Variables Test');
console.log('--------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '*** (set)' : 'Not set');
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS || 'Not set');

// Test if we can access the OpenAI module
try {
  const OpenAI = require('openai');
  console.log('\nOpenAI module test:');
  console.log('OpenAI module loaded successfully');
  
  if (process.env.OPENAI_API_KEY) {
    console.log('Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false
    });
    console.log('OpenAI client initialized successfully');
  } else {
    console.warn('Skipping OpenAI client test: OPENAI_API_KEY not set');
  }
} catch (error) {
  console.error('Error testing OpenAI module:', error);
}
