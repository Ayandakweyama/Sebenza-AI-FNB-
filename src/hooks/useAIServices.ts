// import { useState, useCallback } from 'react';
// import { jobAIService, JobAIService } from '@/lib/ai/jobService';
// import { cvService, CVService } from '@/lib/ai/cvService';
// 
// type ServiceStatus = 'idle' | 'loading' | 'success' | 'error';
// 
// interface AIHookState<T> {
//   data: T | null;
//   error: string | null;
//   status: ServiceStatus;
// }
// 
// const initialState = {
//   data: null,
//   error: null,
//   status: 'idle' as ServiceStatus,
// };
// 
// export function useAIServices() {
//   const [matchState, setMatchState] = useState<AIHookState<any>>(initialState);
//   const [questionsState, setQuestionsState] = 
//     useState<AIHookState<ReturnType<JobAIService['generateInterviewQuestions']>>>(initialState);
//   const [analysisState, setAnalysisState] = 
//     useState<AIHookState<ReturnType<CVService['analyzeResume']>>>(initialState);
// 
//   // Match skills to job
//   const matchSkillsToJob = useCallback(
//     async (jobDescription: string, skills: string[], experience: string) => {
//       setMatchState({ ...initialState, status: 'loading' });
//       try {
//         const result = await jobAIService.matchSkillsToJob(
//           jobDescription,
//           skills,
//           experience
//         );
//         setMatchState({
//           data: result,
//           error: null,
//           status: 'success',
//         });
//         return result;
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Failed to match skills to job';
//         setMatchState({
//           data: null,
//           error: errorMessage,
//           status: 'error',
//         });
//         throw error;
//       }
//     },
//     []
//   );
// 
//   // Generate interview questions
//   const generateInterviewQuestions = useCallback(
//     async (jobTitle: string, jobDescription: string, experience: string) => {
//       setQuestionsState({ ...initialState, status: 'loading' });
//       try {
//         const result = await jobAIService.generateInterviewQuestions(
//           jobTitle,
//           jobDescription,
//           experience
//         );
//         setQuestionsState({
//           data: result,
//           error: null,
//           status: 'success',
//         });
//         return result;
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Failed to generate interview questions';
//         setQuestionsState({
//           data: null,
//           error: errorMessage,
//           status: 'error',
//         });
//         throw error;
//       }
//     },
//     []
//   );
// 
//   // Analyze resume
//   const analyzeResume = useCallback(
//     async (resumeText: string, targetJobTitle?: string) => {
//       setAnalysisState({ ...initialState, status: 'loading' });
//       try {
//         const result = await cvService.analyzeResume(resumeText, targetJobTitle);
//         setAnalysisState({
//           data: result,
//           error: null,
//           status: 'success',
//         });
//         return result;
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Failed to analyze resume';
//         setAnalysisState({
//           data: null,
//           error: errorMessage,
//           status: 'error',
//         });
//         throw error;
//       }
//     },
//     []
//   );
// 
//   // Reset states
//   const resetMatchState = useCallback(() => setMatchState(initialState), []);
//   const resetQuestionsState = useCallback(() => setQuestionsState(initialState), []);
//   const resetAnalysisState = useCallback(() => setAnalysisState(initialState), []);
// 
//   return {
//     // Match skills to job
//     matchSkillsToJob,
//     matchResult: matchState.data,
//     isMatching: matchState.status === 'loading',
//     matchError: matchState.error,
//     resetMatchState,
// 
//     // Interview questions
//     generateInterviewQuestions,
//     questions: questionsState.data,
//     isGeneratingQuestions: questionsState.status === 'loading',
//     questionsError: questionsState.error,
//     resetQuestionsState,
// 
//     // Resume analysis
//     analyzeResume,
//     analysis: analysisState.data,
//     isAnalyzing: analysisState.status === 'loading',
//     analysisError: analysisState.error,
//     resetAnalysisState,
//   };
// }
