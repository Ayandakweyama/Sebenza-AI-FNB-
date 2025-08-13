// import { NextRequest, NextResponse } from 'next/server';
// import { analyzeJobPost, processJobPostInput } from '@/lib/jobPostAnalyzer';
// 
// export async function POST(request: NextRequest) {
//   try {
//     const { input } = await request.json();
// 
//     if (!input || typeof input !== 'string') {
//       return NextResponse.json(
//         { error: 'Job post input is required' },
//         { status: 400 }
//       );
//     }
// 
//     const analysis = await processJobPostInput(input);
//     return NextResponse.json(analysis);
// 
//   } catch (error) {
//     console.error('Error in job post analysis API:', error);
//     
//     return NextResponse.json(
//       { 
//         error: error instanceof Error ? error.message : 'Failed to analyze job post'
//       },
//       { status: 500 }
//     );
//   }
// }
