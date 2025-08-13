// import { NextResponse } from 'next/server';
// import { jobAIService } from '@/lib/ai/jobService';
// 
// export async function POST(request: Request) {
//   try {
//     const { jobTitle, jobDescription, experience } = await request.json();
// 
//     if (!jobTitle || !jobDescription || !experience) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }
// 
//     const questions = await jobAIService.generateInterviewQuestions(
//       jobTitle,
//       jobDescription,
//       experience
//     );
// 
//     return NextResponse.json(questions);
//   } catch (error) {
//     console.error('Error generating interview questions:', error);
//     return NextResponse.json(
//       { error: 'Failed to generate interview questions' },
//       { status: 500 }
//     );
//   }
// }
