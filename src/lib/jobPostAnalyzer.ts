import OpenAI from 'openai';

// Lazy OpenAI client — only instantiated when actually called at runtime,
// NOT at module-load time (which would crash during `next build`).
function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface JobAnalysisResult {
  keywords: string[];
  skills: string[];
  qualifications: string[];
  jobTitle: string;
  company: string;
  summary: string;
}

// Function to extract text from a URL using a proxy or CORS-enabled endpoint
export async function extractTextFromURL(url: string): Promise<string> {
  try {
    // For now, we'll use a simple approach that works with CORS-enabled sites
    // In production, you might want to use a backend proxy or a service like Puppeteer
    const corsProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(corsProxy);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    const html = data.contents;
    
    if (!html) {
      throw new Error('No content found at the provided URL');
    }
    
    // Basic HTML parsing to extract text content
    // Remove scripts and styles
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanHtml;
  } catch (error) {
    throw new Error(`Failed to extract text from URL. Please copy and paste the job description directly instead. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to analyze job post and extract keywords using OpenAI GPT-4o-mini
export async function analyzeJobPost(jobPostText: string): Promise<JobAnalysisResult> {
  // Check if OpenAI is available, if not, use enhanced extraction
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using enhanced keyword extraction');
    return enhancedKeywordExtraction(jobPostText);
  }

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and job market specialist. Your task is to analyze job postings and extract the exact keywords and phrases that ATS systems would search for when screening candidates.

Analyze the following job posting and extract:

1. **ATS-Critical Keywords**: Extract exact terms, phrases, and acronyms that ATS systems prioritize
2. **Technical Skills**: Programming languages, software, tools, platforms, technologies
3. **Required Qualifications**: Education, certifications, licenses, years of experience
4. **Job Details**: Title, company, department/team names
5. **Comprehensive Summary**: Role overview with key requirements

**ATS Keyword Extraction Guidelines:**
- Include exact terms as they appear (e.g., "JavaScript", "JS", "React.js")
- Extract variations and synonyms (e.g., "Machine Learning", "ML", "AI")
- Identify industry-specific terminology and jargon
- Include soft skills when explicitly mentioned as requirements
- Extract measurement terms (e.g., "5+ years", "Bachelor's degree")
- Include location-specific terms if mentioned
- Extract company size indicators (e.g., "startup", "enterprise", "Fortune 500")

**Output the most comprehensive keyword list possible** - ATS systems search for exact matches, so include all relevant variations.

Return the response in JSON format with the following structure:
{
  "jobTitle": "extracted job title",
  "company": "company name if mentioned",
  "keywords": ["comprehensive", "list", "of", "ATS", "searchable", "keywords", "and", "phrases"],
  "skills": ["technical", "skills", "tools", "technologies", "platforms"],
  "qualifications": ["education", "certifications", "experience", "requirements"],
  "summary": "comprehensive summary highlighting all key requirements and expectations"
}`;

  try {
    // Truncate job post text if it's too long (to avoid token limits)
    const truncatedText = jobPostText.length > 10000 ? jobPostText.substring(0, 10000) + '...' : jobPostText;
    
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this job posting (truncated if too long):\n\n${truncatedText}` }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI API');
    }

    // Parse JSON response
    let result: JobAnalysisResult;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse job analysis response. The response was not valid JSON.');
    }
    
    // Validate and clean the result
    return {
      jobTitle: result.jobTitle || 'Unknown Position',
      company: result.company || 'Unknown Company',
      keywords: Array.isArray(result.keywords) ? result.keywords.filter(k => k && k.trim()) : [],
      skills: Array.isArray(result.skills) ? result.skills.filter(s => s && s.trim()) : [],
      qualifications: Array.isArray(result.qualifications) ? result.qualifications.filter(q => q && q.trim()) : [],
      summary: result.summary || 'No summary available'
    };

  } catch (error) {
    console.error('Error analyzing job post:', error);
    throw new Error(`Failed to analyze job post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced keyword extraction without AI
function enhancedKeywordExtraction(jobPostText: string): JobAnalysisResult {
  const text = jobPostText.toLowerCase();
  
  // Common technical skills and tools
  const techKeywords = [
    'javascript', 'python', 'java', 'c++', 'react', 'angular', 'vue', 'node.js', 'nodejs',
    'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'git', 'github', 'gitlab', 'ci/cd', 'agile', 'scrum', 'typescript', 'html', 'css',
    'rest', 'api', 'graphql', 'microservices', 'cloud', 'devops', 'machine learning',
    'ai', 'data science', 'analytics', 'excel', 'powerpoint', 'word', 'office',
    'linux', 'windows', 'macos', 'mobile', 'ios', 'android', 'flutter', 'react native'
  ];
  
  // Common qualifications
  const qualificationKeywords = [
    'bachelor', 'master', 'phd', 'degree', 'certification', 'certified', 'years experience',
    'senior', 'junior', 'mid-level', 'entry level', 'lead', 'manager', 'director',
    'mba', 'cpa', 'pmp', 'aws certified', 'microsoft certified', 'google certified'
  ];
  
  // Extract found keywords
  const foundSkills = techKeywords.filter(skill => text.includes(skill));
  const foundQualifications = qualificationKeywords.filter(qual => text.includes(qual));
  
  // Extract all significant words (3+ chars, not stop words)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);
  
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  // Get unique keywords
  const uniqueWords = Array.from(new Set(words)).slice(0, 50);
  
  // Try to extract job title (usually in first few lines)
  const lines = jobPostText.split('\n').filter(line => line.trim());
  const possibleTitle = lines[0] || 'Job Position';
  
  // Try to extract company name (look for common patterns)
  const companyMatch = jobPostText.match(/(?:company|employer|organization|firm)[\s:]+([A-Z][A-Za-z\s&]+)/i);
  const company = companyMatch ? companyMatch[1].trim() : 'Company';
  
  return {
    jobTitle: possibleTitle.substring(0, 100),
    company: company.substring(0, 100),
    keywords: uniqueWords,
    skills: foundSkills,
    qualifications: foundQualifications,
    summary: jobPostText.substring(0, 300) + '...'
  };
}

// Function to detect if input is a URL
export function isURL(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

// Function to process job post input (either text or URL)
export async function processJobPostInput(input: string): Promise<JobAnalysisResult> {
  if (!input.trim()) {
    throw new Error('Job post input is required');
  }

  let jobPostText: string;

  if (isURL(input.trim())) {
    // Extract text from URL
    jobPostText = await extractTextFromURL(input.trim());
    
    if (!jobPostText || jobPostText.length < 100) {
      throw new Error('Could not extract sufficient text from the provided URL. Please paste the job description directly.');
    }
  } else {
    // Use the input as direct job post text
    jobPostText = input.trim();
  }

  // Analyze the job post text
  return await analyzeJobPost(jobPostText);
}

// Function to combine all extracted data into keyword list for ATS analysis
export function generateKeywordsForATS(jobAnalysis: JobAnalysisResult): string[] {
  const allKeywords = [
    ...jobAnalysis.keywords,
    ...jobAnalysis.skills,
    ...jobAnalysis.qualifications
  ];

  // Remove duplicates and clean keywords
  const uniqueKeywords = Array.from(new Set(
    allKeywords
      .filter(keyword => keyword && keyword.trim())
      .map(keyword => keyword.trim())
  ));

  return uniqueKeywords;
}
