const fs = require('fs');
const path = require('path');

// Simple test without TypeScript compilation
const testCVText = fs.readFileSync('./test-cv.txt', 'utf8');

console.log('Testing CV Parser...');
console.log('==================');

// Basic experience extraction test
const experienceSection = testCVText.match(/Experience[:\s*]([\s\S]*?)(?=\n\n|\n[A-Z]|\nEducation|\nSkills|\nSUMMARY|$)/i);
if (experienceSection && experienceSection[1]) {
  console.log('✓ Found Experience section');
  const expLines = experienceSection[1].split('\n').filter(line => line.trim());
  console.log('Experience lines:', expLines.slice(0, 10));
}

// Skills extraction test
const skillPatterns = [
  /Skills?:?\s*([^\n]+)/i,
  /Technical Skills?:?\s*([^\n]+)/i,
  /Core Competencies?:?\s*([^\n]+)/i,
  /Expertise?:?\s*([^\n]+)/i
];

let foundSkills = [];
for (const pattern of skillPatterns) {
  const match = testCVText.match(pattern);
  if (match && match[1]) {
    foundSkills = match[1].split(/[,;•\n]/).map(s => s.trim()).filter(s => s);
    console.log('✓ Found skills:', foundSkills.slice(0, 5));
    break;
  }
}

console.log('Test completed!');
