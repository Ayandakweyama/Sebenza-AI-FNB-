// OpenAI GPT-4o-mini Service for Career Guidance
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
  timeline: '3' | '6' | '12' | '24';
  currentSkills?: string[];
  industry?: string;
}

export interface SkillGapParams {
  currentSkills: string[];
  targetRole: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industry?: string;
  timeline?: string;
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

  private async callOpenAI(prompt: string, systemPrompt: string): Promise<MistralResponse> {
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
          max_tokens: 2000,
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
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async provideResumeTips(params: ResumeTipsParams): Promise<string> {
    const systemPrompt = `You are Afrigter, an expert career mentor and resume consultant with 15+ years of experience helping professionals across all industries. You provide actionable, specific, and personalized resume feedback.

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

## 🎯 Overall Assessment
[Brief 2-3 sentence summary of resume strengths and areas for improvement]

## ✅ Strengths
[List 3-4 specific strengths with examples from the resume]

## 🔧 Areas for Improvement
[List 4-6 specific areas that need work, with actionable suggestions]

## 📈 ATS Optimization
[Specific recommendations for improving ATS compatibility]

## 🎨 Format & Structure
[Suggestions for layout, design, and organization improvements]

## 💡 Action Items
[5-7 specific, prioritized tasks to improve the resume]

Keep recommendations specific, actionable, and tailored to the ${params.experienceLevel} level and ${params.targetRole || 'their career goals'}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async conductInterviewPrep(params: InterviewPrepParams): Promise<string> {
    const systemPrompt = `You are Afrigter, an expert interview coach and career mentor with extensive experience preparing candidates for interviews across all industries and levels. You create realistic, relevant interview scenarios and provide constructive feedback.

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

## 🎯 Interview Overview
[Brief overview of what to expect for this type of interview]

## 📋 Common Questions (${params.interviewType || 'General'})
[Provide 8-10 realistic questions with brief guidance on how to approach each]

## 🌟 STAR Method Examples
[3-4 example scenarios using the STAR method relevant to this role]

## 🏢 Company Research Tips
[Specific areas to research and questions to ask]

## 💼 Questions to Ask Them
[6-8 thoughtful questions to ask the interviewer]

## 🎭 Mock Interview Scenario
[A realistic 3-question mock interview with sample answers]

## 📝 Pre-Interview Checklist
[Practical preparation steps and what to bring/do]

## 🚀 Follow-up Strategy
[How and when to follow up after the interview]

Tailor all advice to the ${params.experienceLevel} level and ${params.role} position.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async searchJobs(params: JobSearchParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a strategic career advisor and job search expert with deep knowledge of modern recruitment practices, industry trends, and effective job search methodologies.

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

## 🎯 Market Analysis
[Current market conditions and opportunities for this role in these locations]

## 🗺️ Search Strategy
[Comprehensive approach including timelines and priorities]

## 💼 Job Boards & Platforms
[Specific platforms and resources for this role/industry, ranked by effectiveness]

## 🤝 Networking Strategy
[Specific networking approaches and platforms for this field]

## 📱 Personal Branding
[LinkedIn optimization and online presence recommendations]

## 📊 Application Tracking
[System for organizing and tracking applications]

## 💰 Salary Research
[Salary ranges and negotiation strategies for this role/location]

## 📅 Weekly Action Plan
[Specific weekly tasks and goals for job search success]

## 🚀 Quick Wins
[Immediate actions to take in the first week]

Focus on ${params.experienceLevel}-level opportunities in ${params.field} within ${params.locations.join(', ')}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async provideCareerAdvice(params: CareerAdviceParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a seasoned career mentor and professional development expert with 20+ years of experience guiding professionals through career transitions, growth challenges, and strategic decisions.

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

## 🎯 Situation Analysis
[Analysis of the current situation and key factors to consider]

## 💡 Strategic Recommendations
[3-4 main strategic approaches with pros and cons]

## 📈 Action Plan
[Specific, prioritized steps with timelines]

## 🛠️ Skills & Development
[Relevant skills to develop and resources for growth]

## 🤝 Networking & Relationships
[Relationship-building strategies relevant to this situation]

## ⚠️ Potential Challenges
[Obstacles to anticipate and how to overcome them]

## 📊 Success Metrics
[How to measure progress and success]

## 🔄 Alternative Paths
[Other options to consider if the primary path doesn't work]

## 📚 Resources & Tools
[Specific books, courses, tools, or platforms to help]

Tailor all advice to someone at the ${params.experienceLevel} level in ${params.industry || 'their current industry'}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async generateCareerRoadmap(params: CareerRoadmapParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a strategic career planning expert specializing in creating detailed, actionable career roadmaps. You help professionals navigate complex career transitions with realistic timelines and measurable milestones.

Your expertise includes:
- Career progression planning and milestone setting
- Skill gap analysis and development planning
- Industry transition strategies
- Leadership development pathways
- Certification and education planning
- Portfolio career development
- Long-term career sustainability

Create detailed, realistic roadmaps with specific timelines, milestones, and actionable steps.`;

    const prompt = `Create a comprehensive career roadmap for this transition:

**Current Role:** ${params.currentRole}
**Target Role:** ${params.targetRole}
**Experience Level:** ${params.experienceLevel}
**Timeline:** ${params.timeline} months
**Current Skills:** ${params.currentSkills?.join(', ') || 'Not specified'}
**Industry:** ${params.industry || 'Not specified'}

**Please create a detailed ${params.timeline}-month career roadmap:**

## 🎯 Transition Overview
[Summary of the career transition and key requirements]

## 📊 Gap Analysis
[Skills, experience, and qualifications needed for the target role]

## 🗓️ Timeline Breakdown

### Months 1-${Math.ceil(parseInt(params.timeline) / 4)}: Foundation Phase
[Specific goals, activities, and milestones]

### Months ${Math.ceil(parseInt(params.timeline) / 4) + 1}-${Math.ceil(parseInt(params.timeline) / 2)}: Development Phase
[Skill building and experience gaining activities]

### Months ${Math.ceil(parseInt(params.timeline) / 2) + 1}-${Math.ceil(parseInt(params.timeline) * 3 / 4)}: Application Phase
[Practical application and portfolio building]

### Months ${Math.ceil(parseInt(params.timeline) * 3 / 4) + 1}-${params.timeline}: Transition Phase
[Job search and transition execution]

## 🎓 Learning & Development Plan
[Specific courses, certifications, and skill development activities]

## 💼 Experience Building
[Projects, volunteer work, or side activities to gain relevant experience]

## 🤝 Networking Strategy
[Industry connections and relationship building plan]

## 📈 Progress Tracking
[Key performance indicators and milestone checkpoints]

## 💰 Financial Planning
[Budget considerations for training, certification, potential salary changes]

## 🚀 Quick Wins
[Early achievements to build momentum]

## ⚠️ Risk Mitigation
[Potential obstacles and backup plans]

Focus on realistic, achievable steps for someone at the ${params.experienceLevel} level transitioning to ${params.targetRole}.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }

  async analyzeSkillGap(params: SkillGapParams): Promise<string> {
    const systemPrompt = `You are Afrigter, a skills assessment and professional development expert with deep knowledge of industry requirements, emerging technologies, and career development pathways across all sectors.

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

**Current Skills:** ${params.currentSkills.join(', ')}
**Target Role:** ${params.targetRole}
**Experience Level:** ${params.experienceLevel}
**Industry:** ${params.industry || 'Not specified'}
**Development Timeline:** ${params.timeline || '6 months'}

**Please provide a detailed skill gap analysis:**

## 🎯 Role Requirements Analysis
[Detailed breakdown of skills required for the target role]

## 📊 Current Skills Assessment
[Evaluation of existing skills and their relevance/transferability]

## 🔍 Gap Identification

### Critical Gaps (High Priority)
[Skills essential for the role that are missing]

### Important Gaps (Medium Priority)
[Skills that would significantly improve candidacy]

### Nice-to-Have Gaps (Low Priority)
[Skills that would be beneficial but not essential]

## 📈 Skill Development Roadmap

### Phase 1: Foundation (Months 1-2)
[Core skills to develop first]

### Phase 2: Specialization (Months 3-4)
[Role-specific skills and deeper expertise]

### Phase 3: Advanced (Months 5-6)
[Advanced skills and emerging technologies]

## 🎓 Learning Resources & Methods
[Specific courses, platforms, books, and practical learning approaches for each skill]

## 💼 Practical Application
[Projects, exercises, and real-world applications to practice new skills]

## 📜 Certifications & Credentials
[Relevant certifications ranked by importance and ROI]

## 📊 Progress Tracking
[How to measure skill development and competency growth]

## 💰 Investment Analysis
[Time and financial investment required, with expected ROI]

## 🚀 Quick Wins
[Skills that can be developed quickly to show immediate progress]

Prioritize recommendations for ${params.experienceLevel}-level professionals targeting ${params.targetRole} roles.`;

    const response = await this.callOpenAI(prompt, systemPrompt);
    return response.content;
  }
}

export const mistralService = new OpenAIService();
export type ServiceType = 'resume-tips' | 'interview-prep' | 'job-search' | 'career-advice' | 'career-roadmap' | 'skill-gap';
