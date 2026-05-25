// OpenAI GPT-4o-mini Service for Career Guidance
import { stripEmojis } from '../text/stripEmojis';

export interface MistralResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ResumeTipsParams {
  resumeText: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  targetRole?: string;
  industry?: string;
}

export interface InterviewPrepParams {
  role: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  company?: string;
  industry?: string;
  interviewType?: 'technical' | 'behavioral' | 'case-study' | 'general';
}

export interface JobSearchParams {
  role: string;
  field: string;
  locations: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  salary?: string;
  workType?: 'remote' | 'hybrid' | 'onsite';
}

export interface CareerAdviceParams {
  question: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  currentRole?: string;
  industry?: string;
  goals?: string;
}

export interface CareerRoadmapParams {
  currentRole: string;
  targetRole: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  timeline: string;
  currentSkills?: string[];
  industry?: string;
  goals?: string;
  cvText?: string;
}

export interface SkillGapParams {
  currentSkills?: string[];
  currentRole?: string;
  targetRole: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industry?: string;
  timeline?: string;
  jobDescription?: string;
  cvText?: string;
}

export interface CoverLetterParams {
  jobDescription: string;
  resumeText: string;
  companyName?: string;
  jobTitle?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface CVRegeneratorParams {
  cvText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

class OpenAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-4o-mini';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.');
    }
  }

  private async callOpenAI(prompt: string, systemPrompt: string, maxTokens: number = 2000): Promise<MistralResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
          top_p: 1,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      return {
        content: stripEmojis(data.choices[0]?.message?.content || ''),
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async provideResumeTips(params: ResumeTipsParams): Promise<string> {
    const systemPrompt = `You are Afrigter, an expert career mentor and resume consultant with 15+ years of experience helping professionals across all industries. You provide actionable, specific, and personalized resume feedback. Do not use emojis.

Your expertise includes:
- ATS optimization and keyword strategies
- Industry-specific resume formats and requirements
- Achievement quantification and impact statements
- Modern resume design and structure best practices
- Tailoring resumes for specific roles and companies

Provide detailed, actionable feedback in a structured format with specific examples and recommendations.`;

    const prompt = `Please analyze this resume and provide comprehensive feedback:

**Resume Content:**
${params.resumeText}

**Context:**
- Experience Level: ${params.experienceLevel}
- Target Role: ${params.targetRole || 'Not specified'}
- Industry: ${params.industry || 'Not specified'}

**Please provide feedback in the following structure:**

## Overall Assessment
[Brief 2-3 sentence summary of resume strengths and areas for improvement]

## Strengths
[List 3-4 specific strengths with examples from the resume]

## Areas for Improvement
[List 4-6 specific areas that need work, with actionable suggestions]

## ATS Optimization
[Specific recommendations for improving ATS compatibility]

## Format & Structure
[Suggestions for layout, design, and organization improvements]

## Action Items
[5-7 specific, prioritized tasks to improve the resume]

Keep recommendations specific, actionable, and tailored to the ${params.experienceLevel} level and ${params.targetRole || 'their career goals'}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async conductInterviewPrep(params: InterviewPrepParams): Promise<string> {
    const systemPrompt = `You are Afrigter, an expert interview coach and career mentor with extensive experience preparing candidates for interviews across all industries and levels. You create realistic, relevant interview scenarios and provide constructive feedback. Do not use emojis.

Your expertise includes:
- Behavioral interview techniques (STAR method)
- Technical interview preparation
- Company research and culture fit assessment
- Salary negotiation strategies
- Interview anxiety management
- Follow-up best practices

Provide comprehensive interview preparation with realistic questions and detailed guidance.`;

    const prompt = `Prepare me for an interview with the following details:

**Role:** ${params.role}
**Experience Level:** ${params.experienceLevel}
**Company:** ${params.company || 'Not specified'}
**Industry:** ${params.industry || 'Not specified'}
**Interview Type:** ${params.interviewType || 'general'}

**Please provide a comprehensive interview preparation guide:**

## Interview Overview
[Brief overview of what to expect for this type of interview]

## Common Questions (${params.interviewType || 'General'})
[Provide 8-10 realistic questions with brief guidance on how to approach each]

## STAR Method Examples
[3-4 example scenarios using the STAR method relevant to this role]

## Company Research Tips
[Specific areas to research and questions to ask]

## Questions to Ask Them
[6-8 thoughtful questions to ask the interviewer]

## Mock Interview Scenario
[A realistic 3-question mock interview with sample answers]

## Pre-Interview Checklist
[Practical preparation steps and what to bring/do]

## Follow-up Strategy
[How and when to follow up after the interview]

Tailor all advice to the ${params.experienceLevel} level and ${params.role} position.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async searchJobs(params: JobSearchParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a strategic career advisor and job search expert with deep knowledge of modern recruitment practices, industry trends, and effective job search methodologies. Do not use emojis.

Your expertise includes:
- Job market analysis and trends
- Strategic job search planning
- Networking and relationship building
- Personal branding and online presence
- Application optimization and tracking
- Salary research and negotiation
- Remote work and modern work arrangements

Provide comprehensive, actionable job search strategies tailored to the specific role and market conditions.`;

    const prompt = `Create a comprehensive job search strategy for:

**Target Role:** ${params.role}
**Field/Industry:** ${params.field}
**Locations:** ${params.locations.join(', ')}
**Experience Level:** ${params.experienceLevel}
**Salary Range:** ${params.salary || 'Not specified'}
**Work Type:** ${params.workType || 'Not specified'}

**Please provide a detailed job search strategy:**

## Market Analysis
[Current market conditions and opportunities for this role in these locations]

## Search Strategy
[Comprehensive approach including timelines and priorities]

## Job Boards & Platforms
[Specific platforms and resources for this role/industry, ranked by effectiveness]

## Networking Strategy
[Specific networking approaches and platforms for this field]

## Personal Branding
[LinkedIn optimization and online presence recommendations]

## Application Tracking
[System for organizing and tracking applications]

## Salary Research
[Salary ranges and negotiation strategies for this role/location]

## Weekly Action Plan
[Specific weekly tasks and goals for job search success]

## Quick Wins
[Immediate actions to take in the first week]

Focus on ${params.experienceLevel}-level opportunities in ${params.field} within ${params.locations.join(', ')}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async provideCareerAdvice(params: CareerAdviceParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a seasoned career mentor and professional development expert with 20+ years of experience guiding professionals through career transitions, growth challenges, and strategic decisions. Do not use emojis.

Your expertise includes:
- Career transition planning and execution
- Professional development and skill building
- Leadership development and management training
- Industry analysis and career path optimization
- Work-life balance and career satisfaction
- Entrepreneurship and side business development
- Salary negotiation and career advancement

Provide thoughtful, personalized career guidance with actionable steps and realistic timelines.`;

    const prompt = `Please provide comprehensive career advice for this situation:

**Question/Challenge:** ${params.question}
**Experience Level:** ${params.experienceLevel}
**Current Role:** ${params.currentRole || 'Not specified'}
**Industry:** ${params.industry || 'Not specified'}
**Career Goals:** ${params.goals || 'Not specified'}

**Please provide detailed career guidance:**

## Situation Analysis
[Analysis of the current situation and key factors to consider]

## Strategic Recommendations
[3-4 main strategic approaches with pros and cons]

## Action Plan
[Specific, prioritized steps with timelines]

## Skills & Development
[Relevant skills to develop and resources for growth]

## Networking & Relationships
[Relationship-building strategies relevant to this situation]

## Potential Challenges
[Obstacles to anticipate and how to overcome them]

## Success Metrics
[How to measure progress and success]

## Alternative Paths
[Other options to consider if the primary path doesn't work]

## Resources & Tools
[Specific books, courses, tools, or platforms to help]

Tailor all advice to someone at the ${params.experienceLevel} level in ${params.industry || 'their current industry'}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async generateCareerRoadmap(params: CareerRoadmapParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a strategic career planning expert specializing in creating detailed, actionable career roadmaps. You help professionals navigate complex career transitions with realistic timelines and measurable milestones. Do not use emojis.

Your expertise includes:
- Career progression planning and milestone setting
- Skill gap analysis and development planning
- Industry transition strategies
- Leadership development pathways
- Certification and education planning
- Portfolio career development
- Long-term career sustainability

Create detailed, realistic roadmaps with specific timelines, milestones, and actionable steps.`;

    const timelineMonths = Math.max(3, Math.min(24, parseInt(params.timeline || '6', 10) || 6));
    const phase1End = Math.max(1, Math.ceil(timelineMonths / 4));
    const phase2End = Math.max(phase1End + 1, Math.ceil(timelineMonths / 2));
    const phase3End = Math.max(phase2End + 1, Math.ceil((timelineMonths * 3) / 4));

    const prompt = `Create a comprehensive career roadmap for this transition:

**Current Role:** ${params.currentRole}
**Target Role:** ${params.targetRole}
**Experience Level:** ${params.experienceLevel}
**Timeline:** ${timelineMonths} months
**Current Skills:** ${params.currentSkills?.join(', ') || 'Not specified'}
**Industry:** ${params.industry || 'Not specified'}
${params.goals ? `**Goals:** ${params.goals}\n` : ''}${params.cvText ? `\n**Candidate CV Extract (use as context and source of truth when relevant):**\n${params.cvText}\n` : ''}

**Output requirements**
- Format as Markdown.
- Include a "Step-by-step Roadmap" section where each step uses this exact heading pattern: "### Step N — <Title> (Months X-Y)".
- Each step must include: Objective, Actions (bullets), Deliverable, Resources, and a clear timebox.
- Keep steps practical and measurable for someone at the ${params.experienceLevel} level.

**Please create a detailed ${timelineMonths}-month career roadmap:**

## Transition Overview
[Summary of the career transition and key requirements]

## Gap Analysis
[Skills, experience, and qualifications needed for the target role]

## Step-by-step Roadmap

### Step 1 — Foundation (Months 1-${phase1End})
[Objective, Actions, Deliverable, Resources]

### Step 2 — Skill Build (Months ${phase1End + 1}-${phase2End})
[Objective, Actions, Deliverable, Resources]

### Step 3 — Portfolio/Experience (Months ${phase2End + 1}-${phase3End})
[Objective, Actions, Deliverable, Resources]

### Step 4 — Transition Execution (Months ${phase3End + 1}-${timelineMonths})
[Objective, Actions, Deliverable, Resources]

## Learning & Development Plan
[Specific courses, certifications, and skill development activities]

## Experience Building
[Projects, volunteer work, or side activities to gain relevant experience]

## Networking Strategy
[Industry connections and relationship building plan]

## Progress Tracking
[Key performance indicators and milestone checkpoints]

## Milestone Checklist
[A short checklist of milestones to complete by month]

## Quick Wins
[Early achievements to build momentum]

## Risk Mitigation
[Potential obstacles and backup plans]

Focus on realistic, achievable steps for someone at the ${params.experienceLevel} level transitioning to ${params.targetRole}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async analyzeSkillGap(params: SkillGapParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a skills assessment and professional development expert with deep knowledge of industry requirements, emerging technologies, and career development pathways across all sectors. Do not use emojis.

Your expertise includes:
- Comprehensive skill gap analysis
- Industry-specific competency frameworks
- Learning path optimization and resource curation
- Emerging technology and skill trend analysis
- Certification and credential evaluation
- Practical skill application strategies
- ROI analysis for skill development investments

Provide detailed, actionable skill gap analyses with prioritized learning recommendations.`;

    const prompt = `Conduct a comprehensive skill gap analysis:

${params.currentRole ? `**Current Role:** ${params.currentRole}\n` : ''}**Target Role:** ${params.targetRole}
**Experience Level:** ${params.experienceLevel}
**Industry:** ${params.industry || 'Not specified'}
**Development Timeline:** ${params.timeline || '6 months'}
${params.currentSkills?.length ? `\n**Current Skills (provided by user):** ${params.currentSkills.join(', ')}` : ''}
${params.jobDescription ? `\n**Target Job Description (provided by user):**\n${params.jobDescription}\n` : ''}
${params.cvText ? `\n**Candidate CV Extract (for context — infer skills, experience, and strengths from this):**\n${params.cvText}\n` : ''}

If both a CV extract and a manual skills list exist, treat the CV as the source of truth and use the manual list as extra hints.

**Please provide a detailed skill gap analysis:**

## Role Requirements Analysis
[Detailed breakdown of skills required for the target role]


## Current Skills Assessment
[Evaluation of existing skills and their relevance/transferability]

## Gap Identification

### Critical Gaps (High Priority)
[Skills essential for the role that are missing]

### Important Gaps (Medium Priority)
[Skills that would significantly improve candidacy]

### Nice-to-Have Gaps (Low Priority)
[Skills that would be beneficial but not essential]

## Skill Development Roadmap

### Phase 1: Foundation (Months 1-2)
[Core skills to develop first]

### Phase 2: Specialization (Months 3-4)
[Role-specific skills and deeper expertise]

### Phase 3: Advanced (Months 5-6)
[Advanced skills and emerging technologies]

## Learning Resources & Methods
[Specific courses, platforms, books, and practical learning approaches for each skill]

## Practical Application
[Projects, exercises, and real-world applications to practice new skills]

## Certifications & Credentials
[Relevant certifications ranked by importance and ROI]

## Progress Tracking
[How to measure skill development and competency growth]

## Investment Analysis
[Time and financial investment required, with expected ROI]

## Quick Wins
[Skills that can be developed quickly to show immediate progress]

Prioritize recommendations for ${params.experienceLevel}-level professionals targeting ${params.targetRole} roles.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async regenerateCV(params: CVRegeneratorParams): Promise<string> {
    const systemPrompt = `You are Afrigter, an expert CV writer and ATS optimization specialist with 15+ years of experience tailoring CVs for specific job applications. Do not use emojis.

CRITICAL RULES — YOU MUST FOLLOW THESE:
1. **NEVER fabricate, invent, or exaggerate** any credentials, skills, work experience, education, certifications, or achievements that are not present in the original CV.
2. **ONLY use information that exists in the original CV.** You may rephrase, reorganise, and reword — but every fact must come from the original.
3. You may reorder sections and bullet points to prioritise what is most relevant to the target job.
4. You may rephrase bullet points to use stronger action verbs and quantify achievements where the data already exists.
5. You may add a tailored professional summary that draws ONLY from existing CV content.
6. You may suggest an optional "Key Skills" section that highlights skills already mentioned in the CV that match the job description.
7. If the candidate is missing critical requirements from the job post, note this in a separate "Gap Analysis" section at the end — do NOT add those skills to the CV itself.

Your goal is to make the candidate's REAL experience shine in the context of this specific job.`;

    const prompt = `Regenerate and optimise this CV for the following job posting. Remember: use ONLY the candidate's real information.

**Original CV:**
${params.cvText}

**Target Job Description:**
${params.jobDescription}

${params.jobTitle ? `**Job Title:** ${params.jobTitle}` : ''}
${params.companyName ? `**Company:** ${params.companyName}` : ''}
${params.experienceLevel ? `**Experience Level:** ${params.experienceLevel}` : ''}

**Please produce the following:**

## Enhanced CV

[Produce the full, restructured CV text optimised for this job. Use clean formatting with clear section headers, bullet points, and professional language. Prioritise the most relevant experience and skills for this role.]

## What Was Changed
- [List every change you made and why, so the candidate can verify nothing was fabricated]

## ATS Keyword Match

### Keywords Found in CV
- [List each keyword from the job description that IS present or now highlighted in the CV, one per line]

### Keywords Missing from CV
- [List each keyword from the job description that is NOT in the candidate's background, one per line]

## Gap Analysis
- [List any critical job requirements the candidate does not appear to have, with suggestions on how to address them honestly (e.g. courses, projects, transferable skills)]

## Additional Tips
- [2-3 practical tips for strengthening the application beyond the CV]`;

    const response = await this.callOpenAI(prompt, systemPrompt, 4000);
    return response.content;
  }

  async generateCoverLetter(params: CoverLetterParams): Promise<string> {
    const systemPrompt = `You are Afrigter, an expert career mentor and professional writer specializing in creating compelling, ATS-optimized cover letters. You have 15+ years of experience helping professionals craft personalized cover letters that stand out and get interviews. Do not use emojis.

Your expertise includes:
- ATS-optimized cover letter writing techniques
- Industry-specific language and terminology
- Achievement quantification and impact statements
- Company research and customization strategies
- Modern cover letter formats and best practices
- Psychology of hiring managers and recruiters

Create professional, compelling cover letters that highlight the candidate's unique value proposition and create genuine interest from hiring managers.`;

    const prompt = `Generate a personalized cover letter with the following information:

**Job Description:**
${params.jobDescription}

**Candidate's Resume/Background:**
${params.resumeText}

**Job Title:** ${params.jobTitle || 'Not specified'}
**Company Name:** ${params.companyName || 'Not specified'}
**Experience Level:** ${params.experienceLevel || 'mid'}

**Please generate a professional cover letter that includes:**

## Professional Cover Letter

[Write a compelling 3-4 paragraph cover letter that:]

### Paragraph 1: Introduction & Hook
- Grab attention with a strong opening
- Mention the specific role and how you found it
- Include a brief value proposition

### Paragraph 2: Body & Qualifications
- Connect your experience to the job requirements
- Highlight 2-3 key achievements with quantifiable results
- Show enthusiasm for the company/role

### Paragraph 3: Call to Action & Closing
- Reiterate your interest and fit
- Include a specific call to action
- Professional sign-off

**Key Requirements:**
- Keep the cover letter to 300-400 words
- Use professional, industry-appropriate language
- Include specific examples and metrics where possible
- Tailor content to the job description provided
- Make it ATS-friendly with relevant keywords
- Show genuine interest in the company/role

${params.companyName ? `Research and incorporate specific details about ${params.companyName} if appropriate.` : ''}
${params.experienceLevel ? `Write at a level appropriate for ${params.experienceLevel}-level professionals.` : ''}

Make this cover letter stand out and demonstrate why this candidate is the perfect fit for the role!`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }
}

export const mistralService = new OpenAIService();
export type ServiceType = 'resume-tips' | 'interview-prep' | 'job-search' | 'career-advice' | 'career-roadmap' | 'skill-gap' | 'cover-letter' | 'cv-regenerator';
