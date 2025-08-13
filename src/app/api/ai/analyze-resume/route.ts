// import { NextResponse } from 'next/server';
// import { cvService } from '@/lib/ai/cvService';
// 
// export async function POST(request: Request) {
//   try {
//     const { resumeText, targetJobTitle } = await request.json();
// 
//     if (!resumeText) {
//       return NextResponse.json(
//         { error: 'Resume text is required' },
//         { status: 400 }
//       );
//     }
// 
//     const analysis = await cvService.analyzeResume(resumeText, targetJobTitle);
//     return NextResponse.json(analysis);
//   } catch (error) {
//     console.error('Error analyzing resume:', error);
//     return NextResponse.json(
//       { error: 'Failed to analyze resume' },
//       { status: 500 }
//     );
//   }
// }
