import { NextResponse } from 'next/server';
import { mistralService, ServiceType } from '@/lib/ai/mistralService';
import { stripEmojis } from '@/lib/text/stripEmojis';
import { createHash } from 'crypto';
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

const cacheTtlMs = 5 * 60 * 1000;
const maxCacheEntries = 200;
const responseCache = new Map<string, { expiresAt: number; value: string }>();
const inflight = new Map<string, Promise<string>>();

const getCacheKey = (data: unknown) =>
  createHash('sha256').update(JSON.stringify(data)).digest('hex');

const getCached = (key: string) => {
  const item = responseCache.get(key);
  if (!item) return null;
  if (item.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return item.value;
};

const setCached = (key: string, value: string) => {
  if (responseCache.size >= maxCacheEntries) {
    const firstKey = responseCache.keys().next().value as string | undefined;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { expiresAt: Date.now() + cacheTtlMs, value });
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
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return createErrorResponse(
        'Server configuration error',
        'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.',
        500
      );
    }
    // Parse and validate request body
    let requestData: RequestData;
    try {
      const body = await request.json();
      
      if (!body) {
        throw new Error('Request body is empty');
      }
      requestData = body as RequestData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Afrigter API: Error parsing request body:', errorMessage);
      return createErrorResponse(
        'Invalid request',
        'Could not parse request body. Please ensure you are sending valid JSON.',
        400
      );
    }

    const { type, ...data } = requestData;
    const cacheKey = getCacheKey(requestData);
    
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
    
    try {
      const cached = getCached(cacheKey);
      if (cached) {
        return new NextResponse(JSON.stringify({ response: cached }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const existing = inflight.get(cacheKey);
      if (existing) {
        const value = await existing;
        return new NextResponse(JSON.stringify({ response: value }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const compute = async () => {
        let response: string;
      
        switch (type) {
          case 'resume-tips': {
            const params = data as ResumeTipsParams;
            if (!params.resumeText || !params.experienceLevel) {
              throw new Error('Resume text and experience level are required for resume tips');
            }
            response = await mistralService.provideResumeTips(params);
            break;
          }
          
          case 'interview-prep': {
            const params = data as InterviewPrepParams;
            if (!params.role || !params.experienceLevel) {
              throw new Error('Role and experience level are required for interview preparation');
            }
            response = await mistralService.conductInterviewPrep(params);
            break;
          }
          
          case 'job-search': {
            const params = data as JobSearchParams;
            if (!params.role || !params.field || !params.locations?.length || !params.experienceLevel) {
              throw new Error('Role, field, locations, and experience level are required for job search');
            }
            response = await mistralService.searchJobs(params);
            break;
          }
          
          case 'career-advice': {
            const params = data as CareerAdviceParams;
            if (!params.question || !params.experienceLevel) {
              throw new Error('Question and experience level are required for career advice');
            }
            response = await mistralService.provideCareerAdvice(params);
            break;
          }
          
          case 'career-roadmap': {
            const params = data as CareerRoadmapParams;
            if (!params.currentRole || !params.targetRole || !params.experienceLevel) {
              throw new Error('Current role, target role, and experience level are required for career roadmap');
            }
            const currentSkills =
              Array.isArray((params as any).currentSkills) ? (params as any).currentSkills :
              Array.isArray((params as any).skills) ? (params as any).skills :
              undefined;
            const cvText =
              typeof (params as any).cvText === 'string' && (params as any).cvText.trim().length > 0
                ? (params as any).cvText.slice(0, 12000)
                : undefined;
            response = await mistralService.generateCareerRoadmap({
              ...params,
              timeline: (params.timeline || '6') as any,
              currentSkills,
              cvText
            });
            break;
          }
          
          case 'skill-gap': {
            const params = data as SkillGapParams;
            const hasSkills = Array.isArray(params.currentSkills) && params.currentSkills.length > 0;
            const hasCvText = typeof params.cvText === 'string' && params.cvText.trim().length > 0;
            const hasJobDescription = typeof params.jobDescription === 'string' && params.jobDescription.trim().length > 0;
            if (!params.targetRole || !params.experienceLevel || (!hasSkills && !hasCvText && !hasJobDescription)) {
              throw new Error('Target role, experience level, and at least one of current skills, CV text, or job description are required for skill gap analysis');
            }
            const cvText = hasCvText ? params.cvText!.slice(0, 12000) : undefined;
            const jobDescription = hasJobDescription ? params.jobDescription!.slice(0, 8000) : undefined;
            response = await mistralService.analyzeSkillGap({
              ...params,
              cvText,
              jobDescription,
              currentSkills: hasSkills ? params.currentSkills : []
            });
            break;
          }
          
          case 'cover-letter': {
            const params = data as CoverLetterParams;
            if (!params.jobDescription || !params.resumeText) {
              throw new Error('Job description and resume text are required for cover letter generation');
            }
            response = await mistralService.generateCoverLetter(params);
            break;
          }

          case 'cv-regenerator': {
            const params = data as CVRegeneratorParams;
            if (!params.cvText || !params.jobDescription) {
              throw new Error('CV text and job description are required for CV regeneration');
            }
            response = await mistralService.regenerateCV(params);
            break;
          }
          
          default:
            throw new Error('Invalid request type');
        }

        return stripEmojis(response);
      };

      const promise = compute().finally(() => inflight.delete(cacheKey));
      inflight.set(cacheKey, promise);
      const response = await promise;
      setCached(cacheKey, response);
      
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
      console.error('Afrigter API: Error processing request:', errorMessage);
      
      return createErrorResponse(
        'Processing error',
        `Failed to process request: ${errorMessage}`,
        500
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Afrigter API: Unexpected error:', errorMessage);
    
    return createErrorResponse(
      'Internal Server Error',
      'An unexpected error occurred. Please try again later.',
      500
    );
  }
}
