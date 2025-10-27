import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ATSAnalyzer } from '@/lib/ai/atsAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeText, jobDescription, industry, experienceLevel } = await request.json();

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    const analyzer = new ATSAnalyzer();
    
    // Perform comprehensive AI analysis with contextual reasoning
    const analysis = await analyzer.analyzeResume(resumeText, jobDescription, industry);
    
    // Perform deep contextual fit analysis if job description is provided
    let contextualFit = null;
    if (jobDescription) {
      contextualFit = await analyzer.analyzeContextualFit(
        resumeText,
        jobDescription,
        true // Focus on reasoning, not keywords
      );
    }
    
    // Analyze career narrative and progression
    const careerNarrative = await analyzer.analyzeCareerNarrative(resumeText);
    
    // Evaluate achievement quality and impact
    const achievementAnalysis = await analyzer.evaluateAchievementImpact(resumeText);
    
    // Get keyword suggestions if job description is provided (but weighted less)
    let keywordSuggestions = null;
    if (jobDescription) {
      keywordSuggestions = await analyzer.getKeywordSuggestions(
        resumeText,
        jobDescription,
        industry
      );
    }
    
    // Generate improvement plan based on contextual analysis
    const improvementPlan = await analyzer.generateImprovementPlan(analysis, 85);
    
    // Compare to industry benchmarks if industry is specified
    let benchmarkComparison = null;
    if (industry && experienceLevel) {
      benchmarkComparison = await analyzer.compareToIndustryBenchmarks(
        resumeText,
        industry,
        experienceLevel
      );
    }

    // Combine all analysis results with contextual reasoning emphasis
    const fullAnalysis = {
      ...analysis,
      // Add contextual analysis as primary focus
      contextualFit,
      careerNarrative,
      achievementAnalysis,
      // Keywords are secondary
      keywordSuggestions,
      improvementPlan,
      benchmarkComparison,
      // Metadata
      timestamp: new Date().toISOString(),
      analyzedBy: 'AI-Powered Contextual ATS Analyzer v3.0',
      analysisType: 'Context-First (Beyond Keywords)'
    };

    return NextResponse.json({
      success: true,
      analysis: fullAnalysis
    });

  } catch (error) {
    console.error('ATS Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check analysis history
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real implementation, you would fetch from database
    // For now, return a sample response
    return NextResponse.json({
      success: true,
      history: [],
      message: 'Analysis history feature coming soon'
    });

  } catch (error) {
    console.error('Error fetching ATS history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis history' },
      { status: 500 }
    );
  }
}
