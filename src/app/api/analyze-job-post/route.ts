import { NextRequest, NextResponse } from 'next/server';
import { processJobPostInput, isURL } from '@/lib/jobPostAnalyzer';

export const maxDuration = 30; // 30 second timeout for AI analysis
export const dynamic = 'force-dynamic';

// Basic keyword extraction fallback
function extractBasicKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);

  return Array.from(new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.has(word))
      .slice(0, 50) // Limit to 50 keywords
  ));
}

export async function POST(request: NextRequest) {
  let jobPostText: string = '';
  let input: string = '';
  
  try {
    const body = await request.json();
    jobPostText = body.jobPostText || '';
    input = body.input || '';
    
    // Support both 'jobPostText' and 'input' for backward compatibility
    const textToAnalyze = jobPostText || input;

    if (!textToAnalyze || typeof textToAnalyze !== 'string') {
      return NextResponse.json(
        { error: 'Job post text is required' },
        { status: 400 }
      );
    }

    if (textToAnalyze.trim().length < 50) {
      return NextResponse.json(
        { error: 'Job post text is too short. Please provide a more detailed job description.' },
        { status: 400 }
      );
    }

    console.log('🔍 Analyzing job post...', {
      length: textToAnalyze.length,
      isUrl: isURL(textToAnalyze.trim()),
      preview: textToAnalyze.substring(0, 100) + '...'
    });

    // Use the comprehensive job post analyzer with fallback
    let analysis;
    try {
      analysis = await processJobPostInput(textToAnalyze);
    } catch (aiError) {
      console.warn('AI analysis failed, using fallback extraction:', aiError);
      
      // Fallback to basic keyword extraction
      const basicKeywords = extractBasicKeywords(textToAnalyze);
      analysis = {
        jobTitle: 'Job Position',
        company: 'Company',
        keywords: basicKeywords,
        skills: [],
        qualifications: [],
        summary: textToAnalyze.substring(0, 200) + '...'
      };
    }
    
    console.log('✅ Job post analysis completed:', {
      jobTitle: analysis.jobTitle,
      company: analysis.company,
      keywordCount: analysis.keywords.length,
      skillCount: analysis.skills.length,
      qualificationCount: analysis.qualifications.length
    });

    return NextResponse.json({ 
      success: true,
      analysis: analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        textLength: textToAnalyze.length,
        keywordCount: analysis.keywords.length,
        skillCount: analysis.skills.length,
        qualificationCount: analysis.qualifications.length
      }
    });

  } catch (error) {
    console.error('❌ Error in job post analysis API:', error);
    
    // Always try to return something useful
    try {
      const fallbackKeywords = extractBasicKeywords(jobPostText || input || '');
      return NextResponse.json({ 
        success: true,
        analysis: {
          jobTitle: 'Job Position',
          company: 'Company',
          keywords: fallbackKeywords,
          skills: [],
          qualifications: [],
          summary: 'Analysis performed with basic extraction'
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          textLength: (jobPostText || input || '').length,
          keywordCount: fallbackKeywords.length,
          skillCount: 0,
          qualificationCount: 0,
          fallbackUsed: true
        }
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze job post',
          details: 'Both AI and fallback analysis failed'
        },
        { status: 500 }
      );
    }
  }
}
