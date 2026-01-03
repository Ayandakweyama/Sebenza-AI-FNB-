// Simple test to verify CV upload functionality
const testCVText = `John Doe
johndoe@email.com
+27 72 123 456 789
Johannesburg, South Africa

SUMMARY
Experienced Software Engineer with 5 years of experience in full-stack web development.

EXPERIENCE
Tech Corp
Senior Software Engineer
2020 - Present
• Developed and maintained web applications using React and Node.js
• Led a team of 3 developers on multiple projects

StartupXYZ
Software Developer
2018 - 2020
• Built RESTful APIs using Express.js and MongoDB

EDUCATION
University of Johannesburg
Bachelor of Science in Computer Science
2014 - 2018

SKILLS
Technical Skills: JavaScript, TypeScript, React, Node.js, Express, Python, Django, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS, Git, CI/CD
Soft Skills: Team Leadership, Problem Solving, Communication, Agile Methodology`;

console.log('Testing CV extraction...');
console.log('========================');

// Test experience extraction
const experienceSection = testCVText.match(/Experience[:\s*]([\s\S]*?)(?=\n\n|\n[A-Z]|\nEducation|\nSkills|\nSUMMARY|$)/i);
if (experienceSection && experienceSection[1]) {
  console.log('✓ Experience section found');
  const expLines = experienceSection[1].split('\n').filter(line => line.trim());
  
  // Find companies and positions
  const experiences = [];
  let current = {};
  
  for (const line of expLines) {
    if (line.match(/^[A-Z][a-zA-Z\s&]+$/) && !line.includes('•')) {
      if (Object.keys(current).length > 0) experiences.push(current);
      current = { company: line };
    } else if (line.match(/^(Senior|Lead|Principal|Junior|Associate|Staff|Chief|Head|Director|Manager|Engineer|Developer|Specialist|Consultant|Analyst|Architect)/i)) {
      current.position = line;
    } else if (line.match(/\d{4}/)) {
      current.duration = line;
    }
  }
  
  if (Object.keys(current).length > 0) experiences.push(current);
  
  console.log('Extracted experiences:');
  experiences.forEach((exp, i) => {
    console.log(`  ${i+1}. ${exp.position} at ${exp.company} (${exp.duration})`);
  });
}

// Test skills extraction
const skillsMatch = testCVText.match(/Technical Skills:?\s*([^\n]+)/i);
if (skillsMatch) {
  const skills = skillsMatch[1].split(',').map(s => s.trim());
  console.log(`\n✓ Found ${skills.length} skills:`, skills.slice(0, 5).join(', '), '...');
}

console.log('\nTest completed successfully!');
