import { AIService } from './baseService';
import { generateCareerAdvice, analyzeSkillGap, generateCareerRoadmap } from '../openai';
import { generateCareerAdviceWithDeepSeek } from '../deepseek';

export type ServiceType = 
  | 'resume-tips' 
  | 'interview-prep' 
  | 'job-search' 
  | 'career-advice' 
  | 'career-roadmap' 
  | 'skill-gap';

export interface ResumeTipsParams {
  resumeText: string;
  jobDescription?: string;
  experienceLevel: string;
}

export interface InterviewPrepParams {
  role: string;
  experienceLevel: string;
  industry?: string;
}

export interface JobSearchParams {
  role: string;
  field: string;
  locations: string[];
  experienceLevel: string;
}

export interface CareerAdviceParams {
  question: string;
  experienceLevel: string;
  context?: string;
}

export interface CareerRoadmapParams {
  currentRole: string;
  targetRole: string;
  experienceLevel: string;
  timeline?: '6' | '12';
  interests?: string[];
}

export interface SkillGapParams {
  currentSkills: string[];
  targetRole: string;
  experienceLevel: string;
  industry?: string;
}

export class AfrigterService extends AIService {
  async provideResumeTips(params: ResumeTipsParams) {
    const { resumeText, jobDescription, experienceLevel } = params;
    
    const jobSpecificText = jobDescription ? ' applying to a specific job' : '';
    const jobDescriptionText = jobDescription ? `\n\nJob Description:\n${jobDescription}` : '';
    const jobMatchSection = jobDescription ? '\n5. How well the resume matches the job requirements' : '';
    
    const prompt = `As an expert career advisor, please analyze this resume for a ${experienceLevel} professional${jobSpecificText}.

Resume:
${resumeText}${jobDescriptionText}

Please provide a comprehensive analysis including:
1. ATS Compatibility Score (0-100) with explanation
2. Key strengths in the current resume
3. Areas needing improvement
4. Specific action items to enhance the resume${jobMatchSection}

Format the response in clear sections with emojis for better readability.`;

    return this.generateText(prompt, {}, { temperature: 0.7 });
  }

  async conductInterviewPrep(params: InterviewPrepParams) {
    const { role, experienceLevel, industry } = params;
    
    const industryText = industry ? ` in the ${industry} industry` : '';
    
    const prompt = `You are conducting a mock interview for a ${experienceLevel} ${role}${industryText}.

Generate 5 challenging but fair interview questions that would be asked at this level.
After each question, provide:
- Why this question is asked
- What a strong answer would include
- Common pitfalls to avoid
- A sample answer (1-2 paragraphs)

Structure the response in a clear, easy-to-follow format with emojis.`;

    return this.generateText(prompt, {}, { temperature: 0.7 });
  }

  async searchJobs(params: JobSearchParams) {
    // This would typically call an external job search API
    // For now, we'll generate a strategy
    const { role, field, locations, experienceLevel } = params;
    
    const prompt = `Create a job search strategy for a ${experienceLevel} ${role} in ${field} looking for opportunities in ${locations.join(', ')}.

Include:
1. Best job boards and platforms for this role in the specified locations
2. Recommended search keywords and filters
3. Target companies in the area
4. Networking strategies (events, groups, people)
5. Application tracking system
6. Follow-up strategy

Provide specific, actionable advice tailored to the African job market.`;

    return this.generateText(prompt, {}, { temperature: 0.7 });
  }

  async provideCareerAdvice(params: CareerAdviceParams) {
    const { question, experienceLevel, context } = params;
    
    // Try DeepSeek Chat first for career advice (primary)
    try {
      console.log('Attempting career advice with DeepSeek Chat...');
      return await generateCareerAdviceWithDeepSeek(question, experienceLevel);
    } catch (error) {
      console.warn('DeepSeek Chat career advice failed, trying OpenAI fallback:', error);
      
      // Fallback to OpenAI if DeepSeek Chat fails
      try {
        return await generateCareerAdvice(question, experienceLevel);
      } catch (openAIError) {
        console.warn('OpenAI career advice failed, using base service:', openAIError);
        
        // Final fallback to base service
        const contextText = context ? `\n\nAdditional context: ${context}` : '';
        
        const prompt = `You are a career advisor helping a ${experienceLevel} professional with the following question:

"${question}"${contextText}

Provide a detailed, actionable response that considers the African job market. Structure your answer with:
1. Key insights
2. Actionable steps
3. Potential challenges and how to overcome them
4. Resources for further learning
5. Success metrics`;

        return this.generateText(prompt, {}, { temperature: 0.8 });
      }
    }
  }

  async generateCareerRoadmap(params: CareerRoadmapParams) {
    const { currentRole, targetRole, experienceLevel, timeline = '6', interests } = params;
    
    const interestsText = interests ? ` with interests in ${interests.join(', ')}` : '';
    
    const prompt = `Create a detailed ${timeline}-month career roadmap for transitioning from ${currentRole} to ${targetRole} at the ${experienceLevel} level${interestsText}.

Include for each month:
- Key skills to focus on
- Specific learning objectives
- Recommended projects or exercises
- Relevant certifications or courses (prioritize those available in Africa or online)
- Milestones to track progress
- Local networking opportunities or communities
- Potential mentors or industry leaders to follow

Structure the response in a clear, timeline format with emojis.`;

    return this.generateText(prompt, {}, { temperature: 0.7 });
  }

  async analyzeSkillGap(params: SkillGapParams) {
    const { currentSkills, targetRole, experienceLevel, industry } = params;
    
    const industryText = industry ? ` in the ${industry} industry` : '';
    
    const prompt = `Conduct a skill gap analysis for a professional aiming to become a ${experienceLevel} ${targetRole}${industryText}.

Current Skills: ${currentSkills.join(', ')}

Provide a structured analysis including:
1. Essential skills for the target role (categorized by importance)
2. Current strengths (matching skills)
3. Missing skills (gap analysis)
4. Learning resources for each missing skill (prioritize free/affordable options available in Africa)
5. Recommended learning path with timeline
6. Local certification or training programs if available

Format the response in clear sections with emojis for better readability.`;

    return this.generateText(prompt, {}, { temperature: 0.7 });
  }
}

export const afrigterService = new AfrigterService();
