import { aiService } from './baseService';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export class JobAIService {
  /**
   * Match a candidate's skills to job requirements
   */
  async matchSkillsToJob(
    jobDescription: string,
    candidateSkills: string[],
    candidateExperience: string
  ): Promise<{
    matchScore: number;
    missingSkills: string[];
    strengthAreas: string[];
    improvementSuggestions: string;
  }> {
    const template = `You are an expert career advisor. Analyze how well the candidate's skills match the job requirements.

Job Description:
{jobDescription}

Candidate Skills: {candidateSkills}
Candidate Experience: {candidateExperience}

Provide a JSON response with:
1. matchScore: A score from 0-100 indicating the overall match
2. missingSkills: Array of key skills from the job that are missing
3. strengthAreas: Array of the candidate's strongest matching skills
4. improvementSuggestions: Brief suggestions for improving the match`;

    const result = await aiService.generateText(template, {
      jobDescription,
      candidateSkills: candidateSkills.join(', '),
      candidateExperience,
    });

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Error parsing job match result:', error);
      return {
        matchScore: 0,
        missingSkills: [],
        strengthAreas: [],
        improvementSuggestions: 'Unable to analyze job match at this time.',
      };
    }
  }

  /**
   * Generate personalized interview questions based on job description and candidate profile
   */
  async generateInterviewQuestions(
    jobTitle: string,
    jobDescription: string,
    candidateExperience: string
  ): Promise<{
    technical: string[];
    behavioral: string[];
    companySpecific: string[];
  }> {
    const template = `Generate interview questions for a {jobTitle} position.

Job Description:
{jobDescription}

Candidate Experience:
{candidateExperience}

Generate 3 questions in each category (technical, behavioral, company-specific) that would be relevant for this candidate.

Format your response as JSON with these keys: technical, behavioral, companySpecific (each an array of strings)`;

    const result = await aiService.generateText(template, {
      jobTitle,
      jobDescription,
      candidateExperience,
    });

    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Error parsing interview questions:', error);
      return {
        technical: [],
        behavioral: [],
        companySpecific: [],
      };
    }
  }

  /**
   * Generate a personalized cover letter
   */
  async generateCoverLetter(
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    candidateInfo: {
      name: string;
      experience: string;
      skills: string[];
    },
    tone: 'professional' | 'enthusiastic' | 'formal' = 'professional'
  ): Promise<string> {
    const template = `Write a {tone} cover letter for the following position:

Position: {jobTitle}
Company: {companyName}

Job Description:
{jobDescription}

Candidate Information:
Name: {candidateName}
Experience: {candidateExperience}
Skills: {candidateSkills}

Write a compelling cover letter that highlights the candidate's relevant experience and skills.`;

    return await aiService.generateText(template, {
      jobTitle,
      companyName,
      jobDescription,
      candidateName: candidateInfo.name,
      candidateExperience: candidateInfo.experience,
      candidateSkills: candidateInfo.skills.join(', '),
      tone,
    });
  }
}

export const jobAIService = new JobAIService();
