// import { NextResponse } from 'next/server';
// import { afrigterService, ServiceType } from '@/lib/ai/afrigterService';
// import type { 
//   ResumeTipsParams, 
//   InterviewPrepParams, 
//   JobSearchParams, 
//   CareerAdviceParams, 
//   CareerRoadmapParams, 
//   SkillGapParams 
// } from '@/lib/ai/afrigterService';
// 
// // CORS headers
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// };
// 
// // Define types for request data
// type RequestData = {
//   type: ServiceType;
//   [key: string]: any;
// };
// 
// // Handle OPTIONS method for CORS preflight
// async function handleOptions(request: Request) {
//   return new NextResponse(null, {
//     status: 204,
//     headers: {
//       ...corsHeaders,
//     },
//   });
// }
// 
// // Helper function to create error responses
// function createErrorResponse(error: string, message: string, status: number) {
//   console.error(`API Error (${status}): ${error} - ${message}`);
//   return new NextResponse(
//     JSON.stringify({ error, message }),
//     { 
//       status,
//       headers: {
//         'Content-Type': 'application/json',
//         ...corsHeaders,
//       }
//     }
//   );
// }
// 
// export async function POST(request: Request) {
//   console.log('Afrigter API: Received request');
//   
//   // Handle CORS preflight
//   if (request.method === 'OPTIONS') {
//     console.log('Afrigter API: Handling OPTIONS request');
//     return handleOptions(request);
//   }
//   
//   try {
//     // Check for DeepSeek API key
//     console.log('Afrigter API: Checking for DeepSeek API key');
//     if (!process.env.DEEPSEEK_CHAT_API_KEY) {
//       return createErrorResponse(
//         'Server configuration error',
//         'DeepSeek Chat API key is not configured. Please check your Vercel environment variables.',
//         500
//       );
//     }
// 
//     // Parse and validate request body
//     console.log('Afrigter API: Parsing request body');
//     let requestData: RequestData;
//     try {
//       const body = await request.json();
//       console.log('Afrigter API: Raw request body:', JSON.stringify(body, null, 2));
//       
//       if (!body) {
//         throw new Error('Request body is empty');
//       }
//       requestData = body as RequestData;
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       console.error('Afrigter API: Error parsing request body:', errorMessage);
//       return createErrorResponse(
//         'Invalid request',
//         'Could not parse request body. Please ensure you are sending valid JSON.',
//         400
//       );
//     }
// 
//     const { type, ...data } = requestData;
//     console.log('Afrigter API: Processing request type:', type, 'with data:', JSON.stringify(data, null, 2));
//     
//     // Validate request data
//     const validServiceTypes: ServiceType[] = [
//       'resume-tips',
//       'interview-prep',
//       'job-search',
//       'career-advice',
//       'career-roadmap',
//       'skill-gap'
//     ];
// 
//     if (!type || !validServiceTypes.includes(type as ServiceType)) {
//       return createErrorResponse(
//         'Invalid request type',
//         `Request type must be one of: ${validServiceTypes.join(', ')}`,
//         400
//       );
//     }
//     
//     let response;
//     
//     try {
//       console.log(`Afrigter API: Processing ${type} request`);
//       
//       switch (type) {
//         case 'resume-tips': {
//           const params = data as ResumeTipsParams;
//           if (!params.resumeText || !params.experienceLevel) {
//             throw new Error('Resume text and experience level are required for resume tips');
//           }
//           console.log('Afrigter API: Generating resume tips...');
//           response = await afrigterService.provideResumeTips(params);
//           break;
//         }
//           
//         case 'interview-prep': {
//           const params = data as InterviewPrepParams;
//           if (!params.role || !params.experienceLevel) {
//             throw new Error('Role and experience level are required for interview preparation');
//           }
//           console.log('Afrigter API: Generating interview questions...');
//           response = await afrigterService.conductInterviewPrep(params);
//           break;
//         }
//           
//         case 'job-search': {
//           const params = data as JobSearchParams;
//           if (!params.role || !params.field || !params.locations?.length || !params.experienceLevel) {
//             throw new Error('Role, field, locations, and experience level are required for job search');
//           }
//           console.log('Afrigter API: Generating job search strategy...');
//           response = await afrigterService.searchJobs(params);
//           break;
//         }
//           
//         case 'career-advice': {
//           const params = data as CareerAdviceParams;
//           if (!params.question || !params.experienceLevel) {
//             throw new Error('Question and experience level are required for career advice');
//           }
//           console.log('Afrigter API: Generating career advice...');
//           response = await afrigterService.provideCareerAdvice(params);
//           break;
//         }
//           
//         case 'career-roadmap': {
//           const params = data as CareerRoadmapParams;
//           if (!params.currentRole || !params.targetRole || !params.experienceLevel) {
//             throw new Error('Current role, target role, and experience level are required for career roadmap');
//           }
//           console.log('Afrigter API: Generating career roadmap...');
//           response = await afrigterService.generateCareerRoadmap({
//             ...params,
//             timeline: params.timeline || '6' as const
//           });
//           break;
//         }
//           
//         case 'skill-gap': {
//           const params = data as SkillGapParams;
//           if (!params.currentSkills?.length || !params.targetRole || !params.experienceLevel) {
//             throw new Error('Current skills, target role, and experience level are required for skill gap analysis');
//           }
//           console.log('Afrigter API: Analyzing skill gap...');
//           response = await afrigterService.analyzeSkillGap(params);
//           break;
//         }
//           
//         default:
//           return createErrorResponse(
//             'Invalid request type',
//             `Request type must be one of: ${validServiceTypes.join(', ')}`,
//             400
//           );
//       }
//       
//       console.log('Afrigter API: Request processed successfully');
//       return new NextResponse(
//         JSON.stringify({ response }),
//         { 
//           status: 200,
//           headers: {
//             'Content-Type': 'application/json',
//             ...corsHeaders,
//           }
//         }
//       );
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//       console.error('Afrigter API: Error processing request:', errorMessage, error);
//       
//       return createErrorResponse(
//         'Processing error',
//         `Failed to process request: ${errorMessage}`,
//         500
//       );
//     }
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//     console.error('Afrigter API: Unexpected error:', errorMessage, error);
//     
//     return createErrorResponse(
//       'Internal Server Error',
//       'An unexpected error occurred. Please try again later.',
//       500
//     );
//   }
// }
