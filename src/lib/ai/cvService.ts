import { aiService } from './baseService';

export class CVService {
  /**
   * Analyze a resume/CV and provide feedback
   */
  async analyzeResume(
    resumeText: string,
    targetJobTitle?: string
  ): Promise<{
    score: number;
    strengths: string[];
    areasForImprovement: string[];
    keywordAnalysis: {
      missingKeywords: string[];
      strongKeywords: string[];
    };
    suggestions: string;
  }> {
    const template = `You are an expert resume reviewer. Analyze the following resume for a ${
      targetJobTitle ? `target position of ${targetJobTitle}` : 'general job search'
    }.

Resume:
{resumeText}

Provide a detailed analysis in JSON format with these keys:
- score: A score from 0-100
- strengths: Array of key strengths
- areasForImprovement: Array of areas that need improvement
- keywordAnalysis: Object with missingKeywords and strongKeywords arrays
- suggestions: Concise suggestions for improvement`;

    const result = await aiService.generateText(template, {
      resumeText,
      targetJobTitle: targetJobTitle || 'general',
    });

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Error parsing CV analysis result:', error);
      return {
        score: 0,
        strengths: [],
        areasForImprovement: [],
        keywordAnalysis: {
          missingKeywords: [],
          strongKeywords: [],
        },
        suggestions: 'Unable to analyze resume at this time.',
      };
    }
  }

  /**
   * Tailor a resume for a specific job description
   */
  async tailorResume(
    resumeText: string,
    jobDescription: string,
    jobTitle: string
  ): Promise<{
    tailoredResume: string;
    changesMade: string[];
    optimizationTips: string[];
  }> {
    const template = `Tailor the following resume for the job title "${jobTitle}" based on the job description below.

Job Description:
${jobDescription}

Current Resume:
${resumeText}

Provide the tailored resume and a summary of changes made. Format your response as JSON with these keys:
- tailoredResume: The improved resume text
- changesMade: Array of specific changes made
- optimizationTips: Array of tips for further optimization`;

    const result = await aiService.generateText(template, {
      resumeText,
      jobDescription,
      jobTitle,
    });

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Error parsing tailored resume result:', error);
      return {
        tailoredResume: resumeText, // Return original if parsing fails
        changesMade: [],
        optimizationTips: [],
      };
    }
  }

  /**
   * Generate a professional summary based on work experience and skills
   */
  async generateProfessionalSummary(
    workExperience: string[],
    skills: string[],
    targetJobTitle?: string
  ): Promise<string> {
    const template = `Write a professional summary for a ${
      targetJobTitle || 'job seeker'
    } with the following experience and skills:

Work Experience:
${workExperience.join('\n')}

Skills:
${skills.join(', ')}

Write a compelling 3-4 sentence professional summary that highlights the most relevant experience and skills.`;

    return await aiService.generateText(template, {
      workExperience: workExperience.join('\n'),
      skills: skills.join(', '),
      targetJobTitle: targetJobTitle || 'professional',
    });
  }
}

export const cvService = new CVService();
