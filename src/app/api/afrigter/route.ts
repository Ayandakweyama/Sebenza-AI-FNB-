import { NextResponse } from 'next/server';
import { mistralService, ServiceType } from '@/lib/ai/mistralService';
import type { 
  ResumeTipsParams, 
  InterviewPrepParams, 
  JobSearchParams, 
  CareerAdviceParams, 
  CareerRoadmapParams, 
  SkillGapParams,
  CoverLetterParams,
  CVRegeneratorParams
} from '@/lib/ai/mistralService';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Define types for request data
type RequestData = {
  type: ServiceType;
  [key: string]: any;
};

// Handle OPTIONS method for CORS preflight
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Helper function to create error responses
function createErrorResponse(error: string, message: string, status: number) {
  console.error(`Afrigter API Error (${status}): ${error} - ${message}`);
  return new NextResponse(
    JSON.stringify({ error, message }),
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    }
  );
}

export async function POST(request: Request) {
  console.log('🤖 Afrigter API: Received request');
  
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return createErrorResponse(
        'Server configuration error',
        'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.',
        500
      );
    }
    
    console.log('🤖 Using OpenAI GPT-4o-mini for career guidance');

    // Parse and validate request body
    let requestData: RequestData;
    try {
      const body = await request.json();
      console.log('📝 Afrigter API: Processing request:', body.type);
      
      if (!body) {
        throw new Error('Request body is empty');
      }
      requestData = body as RequestData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Afrigter API: Error parsing request body:', errorMessage);
      return createErrorResponse(
        'Invalid request',
        'Could not parse request body. Please ensure you are sending valid JSON.',
        400
      );
    }

    const { type, ...data } = requestData;
    
    // Validate request data
    const validServiceTypes: ServiceType[] = [
      'resume-tips',
      'interview-prep',
      'job-search',
      'career-advice',
      'career-roadmap',
      'skill-gap',
      'cover-letter',
      'cv-regenerator'
    ];

    if (!type || !validServiceTypes.includes(type as ServiceType)) {
      return createErrorResponse(
        'Invalid request type',
        `Request type must be one of: ${validServiceTypes.join(', ')}`,
        400
      );
    }
    
    let response: string;
    
    try {
      console.log(`🚀 Afrigter API: Processing ${type} request`);
      
      switch (type) {
        case 'resume-tips': {
          const params = data as ResumeTipsParams;
          if (!params.resumeText || !params.experienceLevel) {
            throw new Error('Resume text and experience level are required for resume tips');
          }
          console.log('📄 Generating resume tips with GPT-4o-mini...');
          response = await mistralService.provideResumeTips(params);
          break;
        }
          
        case 'interview-prep': {
          const params = data as InterviewPrepParams;
          if (!params.role || !params.experienceLevel) {
            throw new Error('Role and experience level are required for interview preparation');
          }
          console.log('🎤 Generating interview preparation with GPT-4o-mini...');
          response = await mistralService.conductInterviewPrep(params);
          break;
        }
          
        case 'job-search': {
          const params = data as JobSearchParams;
          if (!params.role || !params.field || !params.locations?.length || !params.experienceLevel) {
            throw new Error('Role, field, locations, and experience level are required for job search');
          }
          console.log('🔍 Generating job search strategy with GPT-4o-mini...');
          response = await mistralService.searchJobs(params);
          break;
        }
          
        case 'career-advice': {
          const params = data as CareerAdviceParams;
          if (!params.question || !params.experienceLevel) {
            throw new Error('Question and experience level are required for career advice');
          }
          console.log('💡 Generating career advice with GPT-4o-mini...');
          response = await mistralService.provideCareerAdvice(params);
          break;
        }
          
        case 'career-roadmap': {
          const params = data as CareerRoadmapParams;
          if (!params.currentRole || !params.targetRole || !params.experienceLevel) {
            throw new Error('Current role, target role, and experience level are required for career roadmap');
          }
          console.log('🗺️ Generating career roadmap with GPT-4o-mini...');
          response = await mistralService.generateCareerRoadmap({
            ...params,
            timeline: params.timeline || '6' as const
          });
          break;
        }
          
        case 'skill-gap': {
          const params = data as SkillGapParams;
          if (!params.currentSkills?.length || !params.targetRole || !params.experienceLevel) {
            throw new Error('Current skills, target role, and experience level are required for skill gap analysis');
          }
          console.log('📊 Analyzing skill gap with GPT-4o-mini...');
          response = await mistralService.analyzeSkillGap(params);
          break;
        }
          
        case 'cover-letter': {
          const params = data as CoverLetterParams;
          if (!params.jobDescription || !params.resumeText) {
            throw new Error('Job description and resume text are required for cover letter generation');
          }
          console.log('📧 Generating cover letter with GPT-4o-mini...');
          response = await mistralService.generateCoverLetter(params);
          break;
        }

        case 'cv-regenerator': {
          const params = data as CVRegeneratorParams;
          if (!params.cvText || !params.jobDescription) {
            throw new Error('CV text and job description are required for CV regeneration');
          }
          console.log('📝 Regenerating CV with GPT-4o-mini...');
          response = await mistralService.regenerateCV(params);
          break;
        }
          
        default:
          return createErrorResponse(
            'Invalid request type',
            `Request type must be one of: ${validServiceTypes.join(', ')}`,
            400
          );
      }
      
      console.log('✅ Afrigter API: Request processed successfully');
      return new NextResponse(
        JSON.stringify({ response }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Afrigter API: Error processing request:', errorMessage);
      
      return createErrorResponse(
        'Processing error',
        `Failed to process request: ${errorMessage}`,
        500
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('💥 Afrigter API: Unexpected error:', errorMessage);
    
    return createErrorResponse(
      'Internal Server Error',
      'An unexpected error occurred. Please try again later.',
      500
    );
  }
}
