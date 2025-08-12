import OpenAI from 'openai';

// Log environment variables for debugging
console.log('DeepSeek Service: Environment check -', {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***' : 'Not set',
  DEEPSEEK_CHAT_API_KEY: process.env.DEEPSEEK_CHAT_API_KEY ? '***' : 'Not set',
  NODE_ENV: process.env.NODE_ENV,
});

// Initialize DeepSeek clients
let deepseek: OpenAI | null = null;
let deepseekChat: OpenAI | null = null;

// Initialize ATS analysis client
if (process.env.DEEPSEEK_API_KEY) {
  try {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: false
    });
    console.log('DeepSeek ATS client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize DeepSeek ATS client:', error);
  }
} else {
  console.warn('DeepSeek API key not found, ATS analysis will be unavailable');
}

// Initialize chat client for career advice
if (process.env.DEEPSEEK_CHAT_API_KEY) {
  try {
    deepseekChat = new OpenAI({
      apiKey: process.env.DEEPSEEK_CHAT_API_KEY,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: false
    });
    console.log('DeepSeek Chat client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize DeepSeek Chat client:', error);
  }
} else {
  console.warn('DeepSeek Chat API key not found, career advice features will use fallback');
}

export async function generateATSAnalysisWithDeepSeek(cvText: string, jobKeywords?: string[]): Promise<any> {
  if (!deepseek) {
    throw new Error('DeepSeek API key not configured');
  }

  console.log('generateATSAnalysisWithDeepSeek called');
  
  try {
    const jobKeywordContext = jobKeywords && jobKeywords.length > 0 
      ? `\n\n**IMPORTANT**: This CV is being analyzed for a specific job position. The following keywords were extracted from the job posting and should be prioritized in your analysis:\n${jobKeywords.join(', ')}\n\nPlease evaluate how well the CV matches these specific job requirements and provide targeted recommendations.`
      : '';

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst with extensive experience in resume optimization and applicant tracking systems. 

Analyze the provided CV/resume and provide a comprehensive assessment focused on ATS optimization. Your analysis should be thorough, actionable, and specifically tailored to improve ATS compatibility.${jobKeywordContext}

Provide your response as a valid JSON object with the following exact structure:

{
  "overallScore": number (0-100),
  "breakdown": {
    "formatting": number (0-100),
    "keywords": number (0-100),
    "content": number (0-100),
    "length": number (0-100),
    "sections": number (0-100)
  },
  "strengths": [
    "string: specific strength points"
  ],
  "improvements": [
    "string: specific improvement recommendations"
  ],
  "keywordAnalysis": {
    "foundKeywords": [
      "string: relevant keywords found in the CV"
    ],
    "missingKeywords": [
      "string: important keywords missing from the CV"
    ]
  },
  "atsCompatibility": {
    "score": number (0-100),
    "issues": [
      "string: specific ATS compatibility issues"
    ]
  }
}

Focus on:
1. ATS-friendly formatting (clear headings, standard sections, simple layout)
2. Keyword optimization for the specific industry/role
3. Content quality and relevance
4. Appropriate length and structure
5. Section organization and completeness`;

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: `Please analyze this CV for ATS optimization:\n\n${cvText.substring(0, 15000)}`
      }
    ];

    console.log('Sending request to DeepSeek API');
    
    const completion = await deepseek.chat.completions.create({
      messages,
      model: "deepseek-chat",
      max_tokens: 2000,
      temperature: 0.1,
    });

    console.log('Received response from DeepSeek API');
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Received empty response from DeepSeek API');
    }

    // Parse the JSON response
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response as JSON:', content);
      throw new Error('Invalid JSON response from DeepSeek API');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generateATSAnalysisWithDeepSeek:', {
      error: errorMessage,
      cvTextLength: cvText?.length
    });
    
    throw new Error(`Failed to analyze CV with DeepSeek: ${errorMessage}`);
  }
}

export async function generateCareerAdviceWithDeepSeek(question: string, experienceLevel: string) {
  if (!deepseekChat) {
    throw new Error('DeepSeek Chat API key not configured');
  }

  console.log('generateCareerAdviceWithDeepSeek called');
  
  try {
    if (!question || !experienceLevel) {
      throw new Error('Missing required parameters: question and experienceLevel are required');
    }

    const messages = [
      {
        role: "system" as const,
        content: `You are an experienced career advisor with deep expertise in helping professionals at all levels advance their careers. 
        The user has indicated they are at the ${experienceLevel} level. 
        Provide detailed, actionable advice tailored specifically to their experience level. 
        Structure your response in clear paragraphs with specific, practical recommendations.
        Focus on actionable steps they can take immediately.`
      },
      {
        role: "user" as const,
        content: question
      }
    ];

    console.log('Sending career advice request to DeepSeek Chat API');
    
    const completion = await deepseekChat.chat.completions.create({
      messages,
      model: "deepseek-chat",
      max_tokens: 1500,
      temperature: 0.7,
    });

    console.log('Received career advice response from DeepSeek Chat API');
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Received empty response from DeepSeek API');
    }

    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generateCareerAdviceWithDeepSeek:', {
      error: errorMessage,
      questionLength: question?.length,
      experienceLevel
    });
    
    throw new Error(`Failed to generate career advice with DeepSeek: ${errorMessage}`);
  }
}

export { deepseek, deepseekChat };
