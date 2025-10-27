import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false
});

export interface ATSAnalysisResult {
  overallScore: number;
  breakdown: {
    formatting: number;
    keywords: number;
    sections: number;
    readability: number;
    achievements: number;
    skills: number;
    experience: number;
    contextualRelevance: number;
    storytelling: number;
    impact: number;
  };
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    criticalIssues: string[];
  };
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    density: number;
    relevanceScore: number;
  };
  contextualAnalysis: {
    careerProgression: {
      isLogical: boolean;
      gaps: string[];
      strengths: string[];
      score: number;
    };
    skillsAlignment: {
      matchesRole: boolean;
      relevantSkills: string[];
      missingSkills: string[];
      transferableSkills: string[];
      score: number;
    };
    achievementQuality: {
      hasMetrics: boolean;
      impactLevel: 'high' | 'medium' | 'low';
      specificity: number;
      examples: string[];
    };
    storytelling: {
      coherence: number;
      compelling: boolean;
      uniqueValue: string;
      differentiators: string[];
    };
  };
  sectionAnalysis: {
    [key: string]: {
      present: boolean;
      quality: 'excellent' | 'good' | 'fair' | 'poor';
      suggestions: string[];
      contextScore: number;
      reasoning: string;
    };
  };
  atsCompatibility: {
    parseability: number;
    formatIssues: string[];
    recommendations: string[];
  };
  industryInsights: {
    industryStandards: string[];
    competitorComparison: string;
    marketTrends: string[];
  };
  aiRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  aiReasoning: {
    overallAssessment: string;
    fitScore: number;
    hiringProbability: 'high' | 'medium' | 'low';
    keyStrengths: string[];
    mainConcerns: string[];
    verdict: string;
  };
}

export class ATSAnalyzer {
  /**
   * Perform comprehensive AI-powered ATS analysis
   */
  async analyzeResume(
    resumeText: string,
    jobDescription?: string,
    industry?: string
  ): Promise<ATSAnalysisResult> {
    try {
      // Prepare the analysis prompt
      const systemPrompt = `You are an expert ATS analyzer and senior hiring manager with deep understanding of what makes candidates successful. 
      Your analysis goes BEYOND simple keyword matching - you evaluate the CONTEXT, REASONING, and HOLISTIC FIT of the candidate.
      
      Analyze using these CONTEXTUAL REASONING principles:
      
      1. CAREER NARRATIVE ANALYSIS:
         - Does the career progression make logical sense?
         - Are transitions between roles explained and justified?
         - Is there a clear growth trajectory?
         - Do the experiences build upon each other?
      
      2. COMPETENCY DEMONSTRATION (not just keywords):
         - Are skills proven through concrete examples?
         - Do achievements show actual impact and results?
         - Is there evidence of problem-solving ability?
         - Are leadership and collaboration demonstrated?
      
      3. ROLE FIT ASSESSMENT:
         - Does the candidate's story align with the role requirements?
         - Are there transferable skills even if exact keywords are missing?
         - Would this person likely succeed in the role based on their background?
         - What unique value does this candidate bring?
      
      4. CONTEXTUAL RELEVANCE:
         - How relevant is each experience to the target role?
         - Are achievements framed in a way that shows business impact?
         - Does the resume show understanding of the industry/domain?
         - Is there evidence of continuous learning and adaptation?
      
      5. STORYTELLING & COHERENCE:
         - Does the resume tell a compelling professional story?
         - Is there a clear value proposition?
         - Are accomplishments specific and measurable?
         - Does the candidate stand out from typical applicants?
      
      6. HIDDEN STRENGTHS:
         - What strengths might be overlooked by keyword-only analysis?
         - Are there valuable soft skills demonstrated through examples?
         - Is there evidence of potential that keywords might miss?
      
      DO NOT just count keywords. Evaluate the MEANING, CONTEXT, and IMPLICATIONS of the content.
      
      Return a JSON object with the following structure:
      {
        "overallScore": number (0-100),
        "breakdown": {
          "formatting": number (0-100),
          "keywords": number (0-100 - but weighted less than context),
          "sections": number (0-100),
          "readability": number (0-100),
          "achievements": number (0-100 - based on quality not quantity),
          "skills": number (0-100 - demonstrated skills not just listed),
          "experience": number (0-100 - relevance and progression),
          "contextualRelevance": number (0-100 - how well experiences relate to target),
          "storytelling": number (0-100 - narrative coherence and compelling nature),
          "impact": number (0-100 - demonstrated business/organizational impact)
        },
        "detailedAnalysis": {
          "strengths": [array of specific strengths],
          "weaknesses": [array of specific weaknesses],
          "improvements": [array of actionable improvements],
          "criticalIssues": [array of critical issues that must be fixed]
        },
        "keywordAnalysis": {
          "matched": [array of matched keywords],
          "missing": [array of missing important keywords],
          "density": number (keyword density percentage),
          "relevanceScore": number (0-100)
        },
        "contextualAnalysis": {
          "careerProgression": {
            "isLogical": boolean,
            "gaps": [array of identified gaps or concerns],
            "strengths": [array of progression strengths],
            "score": number (0-100)
          },
          "skillsAlignment": {
            "matchesRole": boolean,
            "relevantSkills": [skills that align with role],
            "missingSkills": [important skills not demonstrated],
            "transferableSkills": [skills from other domains that apply],
            "score": number (0-100)
          },
          "achievementQuality": {
            "hasMetrics": boolean,
            "impactLevel": "high|medium|low",
            "specificity": number (0-100),
            "examples": [best achievement examples]
          },
          "storytelling": {
            "coherence": number (0-100),
            "compelling": boolean,
            "uniqueValue": "what makes this candidate unique",
            "differentiators": [key differentiating factors]
          }
        },
        "sectionAnalysis": {
          "contact": { "present": boolean, "quality": "excellent|good|fair|poor", "suggestions": [], "contextScore": number, "reasoning": "why this rating" },
          "summary": { "present": boolean, "quality": "excellent|good|fair|poor", "suggestions": [], "contextScore": number, "reasoning": "why this rating" },
          "experience": { "present": boolean, "quality": "excellent|good|fair|poor", "suggestions": [], "contextScore": number, "reasoning": "why this rating" },
          "education": { "present": boolean, "quality": "excellent|good|fair|poor", "suggestions": [], "contextScore": number, "reasoning": "why this rating" },
          "skills": { "present": boolean, "quality": "excellent|good|fair|poor", "suggestions": [], "contextScore": number, "reasoning": "why this rating" },
          "achievements": { "present": boolean, "quality": "excellent|good|fair|poor", "suggestions": [], "contextScore": number, "reasoning": "why this rating" }
        },
        "atsCompatibility": {
          "parseability": number (0-100),
          "formatIssues": [array of format issues],
          "recommendations": [array of ATS-specific recommendations]
        },
        "industryInsights": {
          "industryStandards": [array of industry-specific standards],
          "competitorComparison": "string describing how resume compares to industry standards",
          "marketTrends": [array of current market trends to consider]
        },
        "aiRecommendations": {
          "immediate": [array of changes to make immediately],
          "shortTerm": [array of improvements for next 1-2 weeks],
          "longTerm": [array of strategic career development suggestions]
        },
        "aiReasoning": {
          "overallAssessment": "detailed assessment of the candidate beyond keywords",
          "fitScore": number (0-100 - likelihood of being a good fit),
          "hiringProbability": "high|medium|low",
          "keyStrengths": [top 3-5 strengths that matter most],
          "mainConcerns": [top 3-5 concerns from a hiring perspective],
          "verdict": "would you recommend this candidate and why"
        }
      }
      
      IMPORTANT: Base your scoring on CONTEXTUAL UNDERSTANDING, not just keyword presence. A resume with fewer keywords but better demonstrated experience should score higher than keyword-stuffed resumes.`;

      const userPrompt = `Analyze this resume for ATS compatibility and provide comprehensive feedback:
      
      RESUME:
      ${resumeText}
      
      ${jobDescription ? `JOB DESCRIPTION:
      ${jobDescription}` : ''}
      
      ${industry ? `INDUSTRY: ${industry}` : ''}
      
      Provide a detailed JSON analysis following the specified structure.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4000
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Ensure all required fields are present with defaults
      return this.validateAndEnrichAnalysis(analysis);
    } catch (error) {
      console.error('AI ATS Analysis Error:', error);
      // Return a fallback analysis if AI fails
      return this.getFallbackAnalysis(resumeText, jobDescription);
    }
  }

  /**
   * Perform deep contextual analysis beyond keywords
   */
  async analyzeContextualFit(
    resumeText: string,
    jobDescription: string,
    focusOnReasoning: boolean = true
  ): Promise<{
    contextScore: number;
    reasoning: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  }> {
    const prompt = `As a senior hiring manager, evaluate this resume's FIT for the role based on CONTEXT and REASONING, not keywords.

    RESUME: ${resumeText}
    JOB DESCRIPTION: ${jobDescription}
    
    Analyze:
    1. Would this person likely succeed in this role? Why or why not?
    2. What transferable skills do they have that aren't obvious from keywords?
    3. What's the quality of their achievements and impact?
    4. Does their career story make sense for this role?
    5. What unique value would they bring?
    
    Focus on UNDERSTANDING and REASONING, not keyword matching.
    
    Return JSON with:
    {
      "contextScore": number (0-100 based on actual fit, not keywords),
      "reasoning": "detailed explanation of your assessment",
      "strengths": ["contextual strengths that matter for this role"],
      "concerns": ["legitimate concerns about fit"],
      "recommendations": ["specific advice to improve their candidacy"]
    }`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: "You are a senior hiring manager who looks beyond keywords to understand true candidate potential." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 2000
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Contextual analysis error:', error);
      return {
        contextScore: 50,
        reasoning: 'Unable to perform deep analysis',
        strengths: [],
        concerns: [],
        recommendations: []
      };
    }
  }

  /**
   * Analyze specific sections with AI
   */
  async analyzeSections(resumeText: string): Promise<any> {
    const prompt = `Analyze each section of this resume and provide detailed feedback on:
    1. Section completeness
    2. Content quality
    3. ATS optimization
    4. Specific improvements needed
    
    Resume: ${resumeText}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an ATS expert analyzing resume sections." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Section analysis error:', error);
      return null;
    }
  }

  /**
   * Analyze career narrative and progression
   */
  async analyzeCareerNarrative(resumeText: string): Promise<{
    narrativeScore: number;
    progression: {
      isLogical: boolean;
      growthPattern: 'ascending' | 'lateral' | 'mixed' | 'unclear';
      gaps: string[];
      transitions: string[];
    };
    story: {
      clarity: number;
      compelling: boolean;
      uniqueAngle: string;
      missingElements: string[];
    };
  }> {
    const prompt = `Analyze the CAREER NARRATIVE and STORY in this resume:
    
    ${resumeText}
    
    Evaluate:
    1. Is there a clear career progression and growth story?
    2. Do role transitions make logical sense?
    3. Is there a compelling narrative that would interest employers?
    4. What's unique about this person's journey?
    5. Are there unexplained gaps or confusing transitions?
    
    Focus on the STORY and PROGRESSION, not technical skills.
    
    Return JSON with narrative analysis.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a career coach analyzing professional narratives." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Career narrative analysis error:', error);
      return {
        narrativeScore: 50,
        progression: {
          isLogical: false,
          growthPattern: 'unclear',
          gaps: [],
          transitions: []
        },
        story: {
          clarity: 50,
          compelling: false,
          uniqueAngle: '',
          missingElements: []
        }
      };
    }
  }

  /**
   * Evaluate achievement quality and impact
   */
  async evaluateAchievementImpact(resumeText: string): Promise<{
    impactScore: number;
    metrics: {
      hasQuantifiableResults: boolean;
      percentageWithMetrics: number;
      strongestAchievements: string[];
      weakAchievements: string[];
    };
    quality: {
      specificity: 'high' | 'medium' | 'low';
      businessImpact: boolean;
      scope: 'individual' | 'team' | 'department' | 'company' | 'industry';
    };
    suggestions: string[];
  }> {
    const prompt = `Evaluate the QUALITY and IMPACT of achievements in this resume:
    
    ${resumeText}
    
    Analyze:
    1. Are achievements specific and quantifiable?
    2. Do they show real business impact?
    3. What's the scope of impact (individual vs organizational)?
    4. Which achievements are strongest/weakest?
    5. How could weak achievements be improved?
    
    Focus on IMPACT and QUALITY, not just presence of achievements.
    
    Return JSON with detailed achievement analysis.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert at evaluating professional achievements and impact." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Achievement impact analysis error:', error);
      return {
        impactScore: 50,
        metrics: {
          hasQuantifiableResults: false,
          percentageWithMetrics: 0,
          strongestAchievements: [],
          weakAchievements: []
        },
        quality: {
          specificity: 'low',
          businessImpact: false,
          scope: 'individual'
        },
        suggestions: []
      };
    }
  }

  /**
   * Get AI-powered keyword suggestions
   */
  async getKeywordSuggestions(
    resumeText: string,
    jobDescription: string,
    targetRole?: string
  ): Promise<{
    essential: string[];
    recommended: string[];
    optional: string[];
    industry: string[];
  }> {
    const prompt = `Based on this resume and job description, suggest keywords to improve ATS matching:
    
    RESUME: ${resumeText}
    JOB DESCRIPTION: ${jobDescription}
    ${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
    
    Categorize keywords as:
    1. Essential (must-have for this role)
    2. Recommended (strongly suggested)
    3. Optional (nice to have)
    4. Industry-specific keywords
    
    Return as JSON with arrays for each category.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an ATS keyword optimization expert." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Keyword suggestion error:', error);
      return {
        essential: [],
        recommended: [],
        optional: [],
        industry: []
      };
    }
  }

  /**
   * Generate improvement suggestions with AI
   */
  async generateImprovementPlan(
    analysis: ATSAnalysisResult,
    targetScore: number = 80
  ): Promise<{
    plan: string[];
    estimatedNewScore: number;
    timeToImplement: string;
    priority: Array<{
      task: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
    }>;
  }> {
    const prompt = `Based on this ATS analysis, create an improvement plan to reach a score of ${targetScore}:
    
    Current Score: ${analysis.overallScore}
    Weaknesses: ${analysis.detailedAnalysis.weaknesses.join(', ')}
    Critical Issues: ${analysis.detailedAnalysis.criticalIssues.join(', ')}
    
    Provide:
    1. Step-by-step improvement plan
    2. Estimated new score after improvements
    3. Time needed to implement changes
    4. Priority matrix (task, impact, effort)
    
    Return as JSON.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a career coach creating ATS improvement plans." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1500
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Improvement plan generation error:', error);
      return {
        plan: ['Review and update resume format', 'Add relevant keywords', 'Quantify achievements'],
        estimatedNewScore: Math.min(analysis.overallScore + 15, 95),
        timeToImplement: '2-3 hours',
        priority: []
      };
    }
  }

  /**
   * Compare resume against industry benchmarks
   */
  async compareToIndustryBenchmarks(
    resumeText: string,
    industry: string,
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
  ): Promise<{
    industryScore: number;
    percentile: number;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  }> {
    const prompt = `Compare this resume to ${industry} industry standards for ${experienceLevel} level:
    
    RESUME: ${resumeText}
    
    Analyze:
    1. How it compares to industry benchmarks
    2. Percentile ranking (0-100)
    3. Strengths relative to industry
    4. Gaps compared to top performers
    5. Specific recommendations
    
    Return as JSON.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an industry expert comparing resumes to benchmarks." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Benchmark comparison error:', error);
      return {
        industryScore: 70,
        percentile: 50,
        strengths: [],
        gaps: [],
        recommendations: []
      };
    }
  }

  /**
   * Validate and enrich the AI analysis
   */
  private validateAndEnrichAnalysis(analysis: any): ATSAnalysisResult {
    // Ensure all required fields exist with sensible defaults
    return {
      overallScore: analysis.overallScore || 0,
      breakdown: {
        formatting: analysis.breakdown?.formatting || 0,
        keywords: analysis.breakdown?.keywords || 0,
        sections: analysis.breakdown?.sections || 0,
        readability: analysis.breakdown?.readability || 0,
        achievements: analysis.breakdown?.achievements || 0,
        skills: analysis.breakdown?.skills || 0,
        experience: analysis.breakdown?.experience || 0,
        contextualRelevance: analysis.breakdown?.contextualRelevance || 0,
        storytelling: analysis.breakdown?.storytelling || 0,
        impact: analysis.breakdown?.impact || 0
      },
      detailedAnalysis: {
        strengths: analysis.detailedAnalysis?.strengths || [],
        weaknesses: analysis.detailedAnalysis?.weaknesses || [],
        improvements: analysis.detailedAnalysis?.improvements || [],
        criticalIssues: analysis.detailedAnalysis?.criticalIssues || []
      },
      keywordAnalysis: {
        matched: analysis.keywordAnalysis?.matched || [],
        missing: analysis.keywordAnalysis?.missing || [],
        density: analysis.keywordAnalysis?.density || 0,
        relevanceScore: analysis.keywordAnalysis?.relevanceScore || 0
      },
      contextualAnalysis: {
        careerProgression: {
          isLogical: analysis.contextualAnalysis?.careerProgression?.isLogical || false,
          gaps: analysis.contextualAnalysis?.careerProgression?.gaps || [],
          strengths: analysis.contextualAnalysis?.careerProgression?.strengths || [],
          score: analysis.contextualAnalysis?.careerProgression?.score || 0
        },
        skillsAlignment: {
          matchesRole: analysis.contextualAnalysis?.skillsAlignment?.matchesRole || false,
          relevantSkills: analysis.contextualAnalysis?.skillsAlignment?.relevantSkills || [],
          missingSkills: analysis.contextualAnalysis?.skillsAlignment?.missingSkills || [],
          transferableSkills: analysis.contextualAnalysis?.skillsAlignment?.transferableSkills || [],
          score: analysis.contextualAnalysis?.skillsAlignment?.score || 0
        },
        achievementQuality: {
          hasMetrics: analysis.contextualAnalysis?.achievementQuality?.hasMetrics || false,
          impactLevel: analysis.contextualAnalysis?.achievementQuality?.impactLevel || 'low',
          specificity: analysis.contextualAnalysis?.achievementQuality?.specificity || 0,
          examples: analysis.contextualAnalysis?.achievementQuality?.examples || []
        },
        storytelling: {
          coherence: analysis.contextualAnalysis?.storytelling?.coherence || 0,
          compelling: analysis.contextualAnalysis?.storytelling?.compelling || false,
          uniqueValue: analysis.contextualAnalysis?.storytelling?.uniqueValue || '',
          differentiators: analysis.contextualAnalysis?.storytelling?.differentiators || []
        }
      },
      sectionAnalysis: analysis.sectionAnalysis || {},
      atsCompatibility: {
        parseability: analysis.atsCompatibility?.parseability || 0,
        formatIssues: analysis.atsCompatibility?.formatIssues || [],
        recommendations: analysis.atsCompatibility?.recommendations || []
      },
      industryInsights: {
        industryStandards: analysis.industryInsights?.industryStandards || [],
        competitorComparison: analysis.industryInsights?.competitorComparison || '',
        marketTrends: analysis.industryInsights?.marketTrends || []
      },
      aiRecommendations: {
        immediate: analysis.aiRecommendations?.immediate || [],
        shortTerm: analysis.aiRecommendations?.shortTerm || [],
        longTerm: analysis.aiRecommendations?.longTerm || []
      },
      aiReasoning: {
        overallAssessment: analysis.aiReasoning?.overallAssessment || '',
        fitScore: analysis.aiReasoning?.fitScore || 0,
        hiringProbability: analysis.aiReasoning?.hiringProbability || 'low',
        keyStrengths: analysis.aiReasoning?.keyStrengths || [],
        mainConcerns: analysis.aiReasoning?.mainConcerns || [],
        verdict: analysis.aiReasoning?.verdict || ''
      }
    };
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  private getFallbackAnalysis(resumeText: string, jobDescription?: string): ATSAnalysisResult {
    // Basic keyword matching
    const keywords = this.extractKeywords(resumeText);
    const jobKeywords = jobDescription ? this.extractKeywords(jobDescription) : [];
    const matchedKeywords = keywords.filter(k => jobKeywords.includes(k));
    
    // Basic scoring
    const keywordScore = jobKeywords.length > 0 
      ? (matchedKeywords.length / jobKeywords.length) * 100 
      : 50;
    
    const hasRequiredSections = this.checkRequiredSections(resumeText);
    const sectionScore = hasRequiredSections.score;
    
    const overallScore = Math.round((keywordScore + sectionScore) / 2);

    return {
      overallScore,
      breakdown: {
        formatting: sectionScore,
        keywords: keywordScore,
        sections: sectionScore,
        readability: 70,
        achievements: 60,
        skills: keywordScore,
        experience: 70,
        contextualRelevance: 50,
        storytelling: 50,
        impact: 50
      },
      detailedAnalysis: {
        strengths: hasRequiredSections.present,
        weaknesses: hasRequiredSections.missing,
        improvements: [
          'Add more quantifiable achievements',
          'Include relevant keywords from job description',
          'Ensure consistent formatting'
        ],
        criticalIssues: hasRequiredSections.missing.length > 2 
          ? ['Missing critical resume sections'] 
          : []
      },
      keywordAnalysis: {
        matched: matchedKeywords,
        missing: jobKeywords.filter(k => !matchedKeywords.includes(k)),
        density: (keywords.length / resumeText.split(' ').length) * 100,
        relevanceScore: keywordScore
      },
      contextualAnalysis: {
        careerProgression: {
          isLogical: true,
          gaps: [],
          strengths: ['Experience shows progression'],
          score: 60
        },
        skillsAlignment: {
          matchesRole: jobDescription ? matchedKeywords.length > 5 : false,
          relevantSkills: keywords.slice(0, 10),
          missingSkills: jobKeywords.slice(0, 5),
          transferableSkills: [],
          score: keywordScore
        },
        achievementQuality: {
          hasMetrics: false,
          impactLevel: 'medium',
          specificity: 50,
          examples: []
        },
        storytelling: {
          coherence: 60,
          compelling: false,
          uniqueValue: 'Analysis requires AI connection',
          differentiators: []
        }
      },
      sectionAnalysis: {},
      atsCompatibility: {
        parseability: 75,
        formatIssues: [],
        recommendations: [
          'Use standard section headers',
          'Avoid tables and graphics',
          'Use simple bullet points'
        ]
      },
      industryInsights: {
        industryStandards: [],
        competitorComparison: 'Analysis requires AI connection',
        marketTrends: []
      },
      aiRecommendations: {
        immediate: ['Review formatting', 'Add keywords'],
        shortTerm: ['Expand experience descriptions'],
        longTerm: ['Develop additional skills']
      },
      aiReasoning: {
        overallAssessment: 'Basic analysis without AI - upgrade for detailed contextual reasoning',
        fitScore: overallScore,
        hiringProbability: overallScore >= 70 ? 'medium' : 'low',
        keyStrengths: hasRequiredSections.present.slice(0, 3),
        mainConcerns: hasRequiredSections.missing.slice(0, 3),
        verdict: 'Requires AI-powered analysis for accurate assessment'
      }
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    return [...new Set(words)];
  }

  /**
   * Check for required resume sections
   */
  private checkRequiredSections(resumeText: string): {
    score: number;
    present: string[];
    missing: string[];
  } {
    const sections = {
      'Contact Information': /(?:email|phone|address|linkedin)/i,
      'Summary/Objective': /(?:summary|objective|profile|about)/i,
      'Experience': /(?:experience|work|employment|career)/i,
      'Education': /(?:education|academic|degree|university|college)/i,
      'Skills': /(?:skills|competencies|expertise|proficiencies)/i
    };

    const present: string[] = [];
    const missing: string[] = [];

    Object.entries(sections).forEach(([name, pattern]) => {
      if (pattern.test(resumeText)) {
        present.push(name);
      } else {
        missing.push(name);
      }
    });

    const score = (present.length / Object.keys(sections).length) * 100;

    return { score, present, missing };
  }
}
