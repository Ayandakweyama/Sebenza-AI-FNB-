// Industry-specific keyword categories
const KEYWORD_CATEGORIES = {
  technical: [
    // Programming
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'HTML', 'CSS', 'SASS', 'LESS', 'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'GraphQL', 'REST', 'API', 'Microservices'
  ],
  business: [
    'Marketing', 'Sales', 'Business Development', 'Strategy', 'Market Research', 'Financial Analysis',
    'Budgeting', 'Forecasting', 'Project Management', 'Stakeholder Management', 'Business Intelligence',
    'CRM', 'ERP', 'Supply Chain', 'Logistics', 'Operations', 'Process Improvement'
  ],
  healthcare: [
    'Patient Care', 'Medical Records', 'HIPAA', 'Clinical Research', 'Healthcare Administration',
    'Nursing', 'Pharmaceuticals', 'Medical Billing', 'CPT Coding', 'ICD-10', 'EMR', 'EHR'
  ],
  education: [
    'Curriculum Development', 'Classroom Management', 'Lesson Planning', 'Student Assessment',
    'Educational Technology', 'Special Education', 'ESL', 'Higher Education', 'Academic Advising'
  ],
  creative: [
    'Graphic Design', 'UI/UX', 'Adobe Creative Suite', 'Typography', 'Branding',
    'Content Creation', 'Copywriting', 'Social Media', 'Video Editing', 'Photography'
  ],
  softSkills: [
    'Leadership', 'Teamwork', 'Communication', 'Problem-solving', 'Time Management',
    'Adaptability', 'Creativity', 'Work Ethic', 'Critical Thinking', 'Decision Making',
    'Emotional Intelligence', 'Conflict Resolution', 'Negotiation', 'Public Speaking'
  ]
};

// Common sections in a CV with variations
const CV_SECTIONS = {
  experience: [
    'experience', 'work experience', 'work history', 'employment history',
    'professional experience', 'career history', 'employment', 'work'
  ],
  education: [
    'education', 'academic background', 'academic qualifications',
    'educational background', 'degrees', 'academic history', 'qualifications'
  ],
  skills: [
    'skills', 'key skills', 'technical skills', 'professional skills',
    'core competencies', 'areas of expertise', 'competencies', 'skill set'
  ],
  other: [
    'projects', 'certifications', 'awards', 'languages',
    'interests', 'references', 'publications', 'volunteer'
  ]
};

// Function to detect sections in the CV
function detectSections(text: string) {
  const lowerText = text.toLowerCase();
  const foundSections: Record<string, boolean> = {
    experience: false,
    education: false,
    skills: false
  };
  
  // Check for each section type
  Object.entries(CV_SECTIONS).forEach(([section, variations]) => {
    if (section === 'other') return; // Skip other sections for this check
    
    // Look for section headers (e.g., "EXPERIENCE" or "Work Experience" on its own line)
    const sectionPattern = new RegExp(`^\\s*(${variations.join('|')})\\s*$`, 'gmi');
    foundSections[section as keyof typeof foundSections] = sectionPattern.test(lowerText);
  });
  
  return foundSections;
}

// Function to detect the most relevant industry based on keywords
function detectIndustry(text: string): {industry: string, confidence: number} {
  const lowerText = text.toLowerCase();
  const industryScores: Record<string, number> = {};
  
  // Calculate scores for each industry
  Object.entries(KEYWORD_CATEGORIES).forEach(([industry, keywords]) => {
    if (industry === 'softSkills') return; // Skip soft skills for industry detection
    
    const score = keywords.reduce((count, keyword) => {
      return count + (lowerText.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    
    industryScores[industry] = score;
  });
  
  // Find the industry with the highest score
  const [industry, score] = Object.entries(industryScores).reduce(
    (max, [key, value]) => (value > max[1] ? [key, value] : max),
    ['general', 0]
  );
  
  // Calculate confidence (score / max possible score for that industry)
  const maxPossibleScore = KEYWORD_CATEGORIES[industry as keyof typeof KEYWORD_CATEGORIES]?.length || 1;
  const confidence = Math.min(1, score / (maxPossibleScore * 0.5)); // Cap at 1 (100%)
  
  return {
    industry: score > 0 ? industry : 'general',
    confidence: parseFloat(confidence.toFixed(2))
  };
}

// Function to extract text from different file types
export async function extractTextFromFile(file: File): Promise<string> {
  // ... existing extractTextFromFile implementation ...
  return ''; // Placeholder - implement file extraction logic here
}

// Helper function to escape special regex characters
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function analyzeText(text: string) {
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Detect the industry of the CV
  const { industry, confidence } = detectIndustry(text);
  
  // Count total words
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  // Detect sections in the CV
  const sectionDetection = detectSections(text);
  const foundSections = Object.entries(sectionDetection)
    .filter(([_, found]) => found)
    .map(([section]) => section);
  
  // Find keywords from all categories
  const allKeywords = Object.values(KEYWORD_CATEGORIES).flat();
  const foundKeywords = allKeywords.filter(keyword => {
    const escapedKeyword = escapeRegExp(keyword);
    return new RegExp(`\\b${escapedKeyword}\\b`, 'i').test(text);
  });
  
  // Generate section-specific feedback
  const sectionFeedback = {
    experience: sectionDetection.experience ? 'Work experience section found' : 'Work experience section is missing or not clearly labeled',
    education: sectionDetection.education ? 'Education section found' : 'Education section is missing or not clearly labeled',
    skills: sectionDetection.skills ? 'Skills section found' : 'Skills section is missing or not clearly labeled'
  };
  
  // Find industry-specific keywords that are missing
  const industryKeywords = KEYWORD_CATEGORIES[industry as keyof typeof KEYWORD_CATEGORIES] || [];
  const missingKeywords = industryKeywords.filter(keyword => 
    !foundKeywords.includes(keyword)
  ).slice(0, 10); // Limit to top 10 missing keywords
  
  // Calculate scores based on section detection
  const requiredSections = ['experience', 'education', 'skills'];
  const foundRequiredSections = requiredSections.filter(section => 
    sectionDetection[section as keyof typeof sectionDetection]
  ).length;
  
  // Section score (40% of total)
  const sectionScore = (foundRequiredSections / requiredSections.length) * 40;
  
  // Keyword score (30% of total)
  const keywordScore = Math.min((foundKeywords.length / 10) * 30, 30);
  
  // Length score (20% of total)
  const lengthScore = Math.min((wordCount / 500) * 20, 20);
  
  // Formatting score (10% of total) - checks for clear section headers
  const formattingScore = 10 * (foundRequiredSections / requiredSections.length);
  
  const overallScore = Math.min(Math.round(sectionScore + keywordScore + lengthScore + formattingScore), 100);
  
  // Generate feedback based on section detection
  const strengths = [];
  const improvements = [];
  
  // Add section-specific feedback
  if (sectionDetection.experience) {
    strengths.push('Work experience section is properly labeled');
  } else {
    improvements.push('Add a clearly labeled "Work Experience" section');
  }
  
  if (sectionDetection.education) {
    strengths.push('Education section is properly labeled');
  } else {
    improvements.push('Add a clearly labeled "Education" section');
  }
  
  if (sectionDetection.skills) {
    strengths.push('Skills section is properly labeled');
  } else {
    improvements.push('Add a clearly labeled "Skills" section');
  }
  
  if (foundKeywords.length >= 5) {
    strengths.push('Good use of relevant keywords');
  } else {
    improvements.push('Add more industry-specific keywords to improve ATS compatibility');
  }
  
  if (wordCount >= 300) {
    strengths.push('Good amount of detail in your CV');
  } else {
    improvements.push('Consider adding more details about your experiences and skills');
  }
  
  // Calculate ATS compatibility (emphasizing sections and keywords)
  const atsScore = Math.min(100, Math.round(
    (sectionScore * 0.5) + // Sections are most important (50% of ATS score)
    (keywordScore * 0.3) + // Keywords are also very important (30%)
    (formattingScore * 0.2) // Formatting matters too (20%)
  ));

  return {
    overallScore,
    industry: {
      name: industry,
      confidence
    },
    sections: {
      experience: sectionDetection.experience,
      education: sectionDetection.education,
      skills: sectionDetection.skills,
      other: foundSections.filter(s => !['experience', 'education', 'skills'].includes(s))
    },
    sectionFeedback,
    breakdown: {
      sections: Math.round((foundRequiredSections / requiredSections.length) * 40),
      keywords: Math.round(keywordScore),
      length: Math.round(lengthScore),
      formatting: Math.round(formattingScore)
    },
    strengths: strengths.length > 0 ? strengths : ['No major strengths identified'],
    improvements: improvements.length > 0 ? improvements : ['No major improvements needed'],
    keywordAnalysis: {
      found: foundKeywords,
      missing: missingKeywords,
      density: Math.round((foundKeywords.length / Math.max(1, wordCount)) * 1000) / 10
    },
    atsCompatibility: {
      score: atsScore,
      issues: improvements.filter(imp => 
        imp.includes('section') || 
        imp.toLowerCase().includes('keyword') ||
        imp.toLowerCase().includes('format')
      ),
      notes: [
        `Industry: ${industry} (${Math.round(confidence * 100)}% confidence)`,
        `Sections detected: ${foundSections.join(', ') || 'None'}`,
        'Tip: Use clear section headers like "WORK EXPERIENCE", "EDUCATION", and "SKILLS" for better ATS parsing.'
      ].join(' | ')
    }
  };
}
