import OpenAI from 'openai';

// Log environment variables for debugging
console.log('OpenAI Service: Environment check -', {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***' : 'Not set',
  NODE_ENV: process.env.NODE_ENV,
  NODE_OPTIONS: process.env.NODE_OPTIONS
});

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  const errorMsg = 'ERROR: OPENAI_API_KEY is not set in environment variables';
  console.error(errorMsg);
  console.error('Make sure to create a .env.local file with OPENAI_API_KEY=your_key_here');
  console.error('And restart your development server after adding it');
  throw new Error(errorMsg);
}

// Initialize OpenAI with API key from environment variables
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: false // Keep this false for server-side usage only
  });
  console.log('OpenAI client initialized successfully');
} catch (error) {
  const errorMsg = `Failed to initialize OpenAI client: ${error instanceof Error ? error.message : 'Unknown error'}`;
  console.error(errorMsg, error);
  throw new Error(errorMsg);
}

export async function generateCareerAdvice(question: string, experienceLevel: string) {
  console.log('generateCareerAdvice called with:', { questionLength: question?.length, experienceLevel });
  
  try {
    if (!question || !experienceLevel) {
      throw new Error('Missing required parameters: question and experienceLevel are required');
    }

    const messages = [
      {
        role: "system" as const,
        content: `You are an experienced career advisor with expertise in helping professionals at all levels. 
        The user has indicated they are at the ${experienceLevel} level. 
        Provide detailed, actionable advice tailored to their experience level. 
        Structure your response in clear paragraphs with specific recommendations.`
      },
      {
        role: "user" as const,
        content: question
      }
    ];

    console.log('Sending request to OpenAI API with model: gpt-3.5-turbo');
    
    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
      max_tokens: 1000,
      temperature: 0.7,
    });

    console.log('Received response from OpenAI API');
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      console.warn('OpenAI API returned empty content in response:', completion);
      throw new Error('Received empty response from OpenAI API');
    }

    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Error in generateCareerAdvice:', {
      error: errorMessage,
      details: errorDetails,
      questionLength: question?.length,
      experienceLevel
    });
    
    throw new Error(`Failed to generate career advice: ${errorMessage}`);
  }
}

export async function analyzeSkillGap(currentSkills: string[], targetRole: string, experienceLevel: string) {
  console.log('analyzeSkillGap called with:', { 
    currentSkills: currentSkills?.length, 
    targetRole, 
    experienceLevel 
  });

  try {
    if (!Array.isArray(currentSkills) || currentSkills.length === 0) {
      throw new Error('currentSkills must be a non-empty array');
    }
    if (!targetRole || !experienceLevel) {
      throw new Error('targetRole and experienceLevel are required');
    }

    const prompt = `As a ${experienceLevel} professional with skills in ${currentSkills.join(', ')}, analyze the skill gaps I need to address to become a ${targetRole}.
    Please provide:
    1. A list of key skills required for the role
    2. An assessment of my current skills against these requirements
    3. A prioritized list of skills to develop
    4. Recommended learning resources for each skill
    5. A suggested timeline for skill development`;
    
    console.log('analyzeSkillGap: Generated prompt');
    return await generateCareerAdvice(prompt, experienceLevel);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyzeSkillGap:', {
      error: errorMessage,
      currentSkills: currentSkills?.length,
      targetRole,
      experienceLevel
    });
    
    throw new Error(`Failed to analyze skill gap: ${errorMessage}`);
  }
}

export async function generateCareerRoadmap(currentRole: string, targetRole: string, timeline: '6' | '12' = '6', experienceLevel: string) {
  console.log('generateCareerRoadmap called with:', { 
    currentRole, 
    targetRole, 
    timeline, 
    experienceLevel 
  });

  try {
    if (!currentRole || !targetRole || !experienceLevel) {
      throw new Error('currentRole, targetRole, and experienceLevel are required');
    }
    if (timeline !== '6' && timeline !== '12') {
      throw new Error('timeline must be either "6" or "12"');
    }

    const prompt = `Create a detailed ${timeline}-month career roadmap for transitioning from ${currentRole} to ${targetRole}.
    The user is at the ${experienceLevel} level.
    Include for each month:
    - Key skills to focus on
    - Specific learning objectives
    - Recommended projects or exercises
    - Relevant certifications or courses
    - Milestones to track progress`;
    
    console.log('generateCareerRoadmap: Generated prompt');
    return await generateCareerAdvice(prompt, experienceLevel);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generateCareerRoadmap:', {
      error: errorMessage,
      currentRole,
      targetRole,
      timeline,
      experienceLevel
    });
    
    throw new Error(`Failed to generate career roadmap: ${errorMessage}`);
  }
}
