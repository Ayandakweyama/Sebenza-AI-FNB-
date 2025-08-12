import { OpenAI } from 'openai';

// Initialize DeepSeek client for job post analysis (server-side only)
let deepseek: OpenAI | null = null;

// Only initialize on server side
if (typeof window === 'undefined' && process.env.DEEPSEEK_API_KEY) {
  try {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: false
    });
    console.log('DeepSeek client initialized for job post analysis');
  } catch (error) {
    console.error('Failed to initialize DeepSeek client for job analysis:', error);
  }
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

// Function to analyze job post and extract keywords using DeepSeek
export async function analyzeJobPost(jobPostText: string): Promise<JobAnalysisResult> {
  if (!deepseek) {
    throw new Error('DeepSeek API key is not configured or client initialization failed');
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
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this job posting:\n\n${jobPostText}` }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from DeepSeek');
    }

    // Parse JSON response
    const result = JSON.parse(content) as JobAnalysisResult;
    
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
