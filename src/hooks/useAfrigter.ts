// import { useState, useCallback } from 'react';
// 
// type AfrigterType = 
//   | 'resume-tips' 
//   | 'interview-prep' 
//   | 'job-search' 
//   | 'career-advice' 
//   | 'career-roadmap' 
//   | 'skill-gap';
// 
// interface BaseAfrigterState {
//   response?: string;
//   error?: string;
//   loading: boolean;
// }
// 
// interface ResumeTipsOptions {
//   type: 'resume-tips';
//   resumeText: string;
//   jobDescription?: string;
//   experienceLevel: string;
// }
// 
// interface InterviewPrepOptions {
//   type: 'interview-prep';
//   role: string;
//   experienceLevel: string;
//   industry?: string;
// }
// 
// interface JobSearchOptions {
//   type: 'job-search';
//   role: string;
//   field: string;
//   locations: string[];
//   experienceLevel: string;
// }
// 
// interface CareerAdviceOptions {
//   type: 'career-advice';
//   question: string;
//   experienceLevel: string;
//   context?: string;
// }
// 
// interface CareerRoadmapOptions {
//   type: 'career-roadmap';
//   currentRole: string;
//   targetRole: string;
//   experienceLevel: string;
//   timeline?: '6' | '12';
//   interests?: string[];
// }
// 
// interface SkillGapOptions {
//   type: 'skill-gap';
//   currentSkills: string[];
//   targetRole: string;
//   experienceLevel: string;
//   industry?: string;
// }
// 
// type AfrigterOptions = 
//   | ResumeTipsOptions
//   | InterviewPrepOptions
//   | JobSearchOptions
//   | CareerAdviceOptions
//   | CareerRoadmapOptions
//   | SkillGapOptions;
// 
// export function useAfrigter<T extends AfrigterType>() {
//   const [state, setState] = useState<BaseAfrigterState>({ loading: false });
// 
//   const callAfrigter = useCallback(async (
//     options: Extract<AfrigterOptions, { type: T }>
//   ): Promise<string | null> => {
//     setState(prev => ({ ...prev, loading: true, error: undefined }));
//     
//     const { type } = options;
//     console.log('useAfrigter: Starting API call with type:', type, 'and options:', options);
//     
//     try {
//       // Add validation for required parameters based on type
//       if (type === 'resume-tips') {
//         const opts = options as ResumeTipsOptions;
//         if (!opts.resumeText || !opts.experienceLevel) {
//           throw new Error('Resume text and experience level are required for resume tips');
//         }
//       } else if (type === 'interview-prep') {
//         const opts = options as InterviewPrepOptions;
//         if (!opts.role || !opts.experienceLevel) {
//           throw new Error('Role and experience level are required for interview preparation');
//         }
//       } else if (type === 'job-search') {
//         const opts = options as JobSearchOptions;
//         if (!opts.role || !opts.field || !opts.locations?.length || !opts.experienceLevel) {
//           throw new Error('Role, field, locations, and experience level are required for job search');
//         }
//       } else if (type === 'career-advice') {
//         const opts = options as CareerAdviceOptions;
//         if (!opts.question || !opts.experienceLevel) {
//           throw new Error('Question and experience level are required for career advice');
//         }
//       } else if (type === 'career-roadmap') {
//         const opts = options as CareerRoadmapOptions;
//         if (!opts.currentRole || !opts.targetRole || !opts.experienceLevel) {
//           throw new Error('Current role, target role, and experience level are required for career roadmap');
//         }
//       } else if (type === 'skill-gap') {
//         const opts = options as SkillGapOptions;
//         if (!opts.currentSkills?.length || !opts.targetRole || !opts.experienceLevel) {
//           throw new Error('Current skills, target role, and experience level are required for skill gap analysis');
//         }
//       } else {
//         throw new Error(`Unsupported service type: ${type}`);
//       }
// 
//       console.log('useAfrigter: Sending request to /api/afrigter');
//       
//       // Create a clean request body with only the necessary properties
//       let requestBody: any = { ...options };
//       
//       // Remove the type from the request body to avoid duplication
//       delete requestBody.type;
//       
//       // Add type back as a separate property
//       const requestData = {
//         type,
//         ...requestBody
//       };
//       
//       console.log('useAfrigter: Request data:', JSON.stringify(requestData, null, 2));
//       
//       const response = await fetch('/api/afrigter', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestData),
//       });
// 
//       console.log('useAfrigter: Received response status:', response.status);
//       
//       // First, get the response as text to check if it's valid JSON
//       const responseText = await response.text();
//       console.log('useAfrigter: Raw response text:', responseText);
//       
//       let result;
//       try {
//         result = responseText ? JSON.parse(responseText) : {};
//         console.log('useAfrigter: Parsed response:', result);
//       } catch (jsonError) {
//         console.error('useAfrigter: Failed to parse JSON response. Error:', jsonError, 'Response text:', responseText);
//         throw new Error('Received invalid response from server. This might be an authentication or server error.');
//       }
// 
//       if (!response.ok) {
//         console.error('useAfrigter: API Error Response - Status:', response.status, 'Response:', result);
//         let errorMessage = 'An unknown error occurred';
//         
//         if (result && result.error) {
//           errorMessage = result.error;
//         } else if (response.status === 401) {
//           errorMessage = 'Authentication failed. Please check your API key in the .env.local file.';
//         } else if (response.status === 500) {
//           errorMessage = 'Server error. Please check the server logs for more details.';
//         } else {
//           errorMessage = `Request failed with status ${response.status}`;
//         }
//         
//         throw new Error(errorMessage);
//       }
// 
//       if (!result.response) {
//         console.error('Unexpected API Response:', result);
//         throw new Error('No response data received from the server');
//       }
// 
//       setState({
//         response: result.response,
//         loading: false,
//         error: undefined,
//       });
// 
//       return result.response;
//     } catch (error) {
//       let errorMessage = 'An unexpected error occurred';
//       
//       if (error instanceof Error) {
//         errorMessage = error.message;
//         // Check for common error patterns
//         if (error.message.includes('Failed to fetch')) {
//           errorMessage = 'Unable to connect to the server. Please check your internet connection.';
//         } else if (error.message.includes('401')) {
//           errorMessage = 'Authentication failed. Please check your API key.';
//         } else if (error.message.includes('429')) {
//           errorMessage = 'Too many requests. Please try again later.';
//         }
//       } else if (typeof error === 'string') {
//         errorMessage = error;
//       }
//       
//       console.error(`Afrigter API Error (${type}):`, error);
//       
//       setState(prev => ({
//         ...prev,
//         error: errorMessage,
//         loading: false,
//       }));
//       
//       return null;
//     }
//   }, []);
// 
//   // Helper functions for each service type
//   const provideResumeTips = useCallback((params: Omit<ResumeTipsOptions, 'type'>) => 
//     callAfrigter({ type: 'resume-tips', ...params } as any), [callAfrigter]);
//     
//   const conductInterviewPrep = useCallback((params: Omit<InterviewPrepOptions, 'type'>) => 
//     callAfrigter({ type: 'interview-prep', ...params } as any), [callAfrigter]);
//     
//   const searchJobs = useCallback((params: Omit<JobSearchOptions, 'type'>) => 
//     callAfrigter({ type: 'job-search', ...params } as any), [callAfrigter]);
//     
//   const provideCareerAdvice = useCallback((params: Omit<CareerAdviceOptions, 'type'>) => 
//     callAfrigter({ type: 'career-advice', ...params } as any), [callAfrigter]);
//     
//   const generateCareerRoadmap = useCallback((params: Omit<CareerRoadmapOptions, 'type'>) => 
//     callAfrigter({ type: 'career-roadmap', ...params } as any), [callAfrigter]);
//     
//   const analyzeSkillGap = useCallback((params: Omit<SkillGapOptions, 'type'>) => 
//     callAfrigter({ type: 'skill-gap', ...params } as any), [callAfrigter]);
// 
//   return {
//     ...state,
//     // Generic call method
//     callAfrigter,
//     
//     // Specific service methods
//     provideResumeTips,
//     conductInterviewPrep,
//     searchJobs,
//     provideCareerAdvice,
//     generateCareerRoadmap,
//     analyzeSkillGap,
//     
//     reset: useCallback(() => {
//       setState({ loading: false });
//     }, []),
//   };
// }
