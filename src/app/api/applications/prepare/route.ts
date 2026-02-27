import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface JobData {
  title: string;
  company: string;
  description: string;
  location?: string;
  type?: string;
  salary?: string;
}

interface UserProfile {
  skills: string[];
  experience: string;
  level: string;
  preferences: string;
}

// Generate tailored CV recommendations using AI and CV data
const generateTailoredCV = async (jobData: JobData, userProfile: UserProfile, cvText?: string) => {
  const prompt = `
You are an expert career coach and resume writer. Based on the following job description, user profile, and actual CV content, provide specific, actionable recommendations for tailoring the CV.

JOB DETAILS:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Description: ${jobData.description}
- Location: ${jobData.location || 'Not specified'}
- Type: ${jobData.type || 'Not specified'}

USER PROFILE:
- Skills: ${userProfile.skills.join(', ')}
- Experience Level: ${userProfile.level || 'Not specified'}
- Experience: ${userProfile.experience || 'Not specified'}
- Preferences: ${userProfile.preferences || 'Not specified'}

${cvText ? `\nACTUAL CV CONTENT:\n${cvText}\n` : 'NOTE: No CV content available - provide general recommendations based on profile.'}

TASK: Analyze the CV content and provide specific, actionable recommendations for tailoring it to this job application.

Provide detailed recommendations for:

1. **Skills Section Optimization**:
   - Which skills from the CV to emphasize and where to place them
   - How to reorder skills based on job requirements
   - Missing skills to highlight from experience

2. **Experience Section Enhancement**:
   - Which experiences from the CV to prioritize
   - How to rephrase bullet points to match job requirements
   - Specific achievements to highlight that align with the role
   - Quantifiable results to emphasize

3. **Professional Summary Optimization**:
   - How to rewrite summary to target this specific role
   - Key phrases and keywords to include
   - How to showcase relevant years of experience

4. **ATS Optimization**:
   - Keywords from job description to integrate throughout CV
   - How to structure sections for ATS parsing
   - Formatting recommendations for better ATS performance

5. **Section Prioritization**:
   - Which sections to expand or condense
   - What to move to top vs. bottom
   - Sections to potentially remove or combine

IMPORTANT FORMATTING RULES:
- Use clean, professional language
- No special characters or unicode symbols
- Proper bullet points and numbered lists
- No regex patterns or code artifacts
- Modern, conversational yet professional tone
- Ensure output is ready to copy-paste and use

Format your response as a comprehensive, actionable guide with clear sections and specific examples from the CV content.
`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach providing specific CV tailoring advice. Analyze the actual CV content and provide detailed, actionable recommendations that help the candidate stand out. Ensure all output is clean, professional, and free of any special characters or formatting issues.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    let recommendations = response.choices[0]?.message?.content || '';
    
    // Clean up AI output
    if (recommendations) {
      // Remove any potential regex artifacts or special characters
      recommendations = recommendations
        .replace(/\n{3,}/g, '\n\n') // Fix excessive line breaks
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Remove carriage returns
        .replace(/\t+/g, ' ') // Replace tabs with spaces
        .replace(/\s{2,}/g, ' ') // Fix excessive spaces
        .trim(); // Remove leading/trailing whitespace
      
      // Ensure proper paragraph spacing
      recommendations = recommendations.replace(/\n\n+/g, '\n\n');
      
      // Remove any potential markdown or code formatting
      recommendations = recommendations.replace(/```[\s\S]*?```/g, '');
      recommendations = recommendations.replace(/`([^`]+)`/g, '$1');
      
      // Clean up any asterisks or bullet points that shouldn't be there
      recommendations = recommendations.replace(/^\*\s+/gm, '');
      recommendations = recommendations.replace(/\s+\*\s+/g, ' ');
      
      // Final cleanup
      recommendations = recommendations.trim();
    }

    return recommendations || 'CV recommendations temporarily unavailable. Please focus on highlighting relevant skills and experience from your CV.';
  } catch (error) {
    console.error('Error generating CV recommendations:', error);
    return 'CV recommendations temporarily unavailable. Please focus on highlighting relevant skills and experience from your CV.';
  }
};

// Generate custom cover letter using CV data
const generateCoverLetter = async (jobData: JobData, userProfile: UserProfile, cvText?: string) => {
  // Extract specific education and experience from CV if available
  let extractedEducation = '';
  let extractedExperience = '';
  let extractedSkills = '';
  
  if (cvText) {
    // Extract education section
    const educationMatch = cvText.match(/EDUCATION[:\s*]([\s\S]*?)(?=\n\n|\nEXPERIENCE|\nSKILLS|\nSUMMARY|$)/i);
    if (educationMatch && educationMatch[1]) {
      extractedEducation = educationMatch[1].trim();
    }
    
    // Extract experience section
    const experienceMatch = cvText.match(/EXPERIENCE[:\s*]([\s\S]*?)(?=\n\n|\nEDUCATION|\nSKILLS|\nSUMMARY|$)/i);
    if (experienceMatch && experienceMatch[1]) {
      extractedExperience = experienceMatch[1].trim();
    }
    
    // Extract skills section
    const skillsMatch = cvText.match(/SKILLS[:\s*]([\s\S]*?)(?=\n\n|\nEXPERIENCE|\nEDUCATION|\nSUMMARY|$)/i);
    if (skillsMatch && skillsMatch[1]) {
      extractedSkills = skillsMatch[1].trim();
    }
  }

  const prompt = `
Write a professional, compelling cover letter for the following job application. Use the candidate's exact CV information to create a personalized narrative.

JOB DETAILS:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Description: ${jobData.description}
- Location: ${jobData.location || 'Not specified'}
- Type: ${jobData.type || 'Not specified'}

CANDIDATE PROFILE:
- Skills: ${userProfile.skills.join(', ')}
- Experience Level: ${userProfile.level || 'Not specified'}
- Experience: ${userProfile.experience || 'Not specified'}
- Preferences: ${userProfile.preferences || 'Not specified'}

${cvText ? `\nEXTRACTED CV DATA:\n\nEDUCATION:\n${extractedEducation || 'Not clearly specified in CV'}\n\nEXPERIENCE:\n${extractedExperience || 'Not clearly specified in CV'}\n\nSKILLS:\n${extractedSkills || 'Not clearly specified in CV'}\n` : ''}

TASK: Write a compelling cover letter that incorporates the candidate's actual education, experience, and skills from their CV.

Requirements:
1. Write a professional cover letter (3-4 paragraphs, 250-350 words)
2. Start with a proper salutation (Dear Hiring Manager, Dear [Company] Team, or Dear [Hiring Manager Name])
3. First paragraph: Express enthusiasm for the role and company
4. Second paragraph: Highlight 2-3 specific experiences from CV that match job requirements
5. Third paragraph: Mention relevant education background and how it applies to the role
6. Fourth paragraph: Explain why candidate is a good fit and include call to action
7. Use specific examples from the extracted CV data (companies, positions, achievements, education)
8. Reference the candidate's actual educational background (degrees, institutions, years)
9. Include specific skills mentioned in the CV that align with job requirements
10. Match tone to be professional but approachable
11. Include keywords from the job description for ATS optimization
12. Ensure clean formatting with proper paragraphs and spacing

IMPORTANT FORMATTING RULES:
- Use clean, professional language
- No special characters or unicode symbols
- Proper paragraph breaks (double line breaks between paragraphs)
- No regex patterns or code artifacts
- Modern, conversational yet professional tone
- Ensure output is ready to copy-paste and send

Format as a complete cover letter ready to send, without any placeholders or special formatting.
`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer who creates personalized, compelling cover letters that help candidates stand out. Use the candidate\'s actual education, experience, and skills from their CV to tell a compelling story. Ensure all output is clean, professional, and free of any special characters or formatting issues.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    let coverLetter = response.choices[0]?.message?.content || '';
    
    // Clean up AI output
    if (coverLetter) {
      // Remove any potential regex artifacts or special characters
      coverLetter = coverLetter
        .replace(/\n{3,}/g, '\n\n') // Fix excessive line breaks
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Remove carriage returns
        .replace(/\t+/g, ' ') // Replace tabs with spaces
        .replace(/\s{2,}/g, ' ') // Fix excessive spaces
        .trim(); // Remove leading/trailing whitespace
      
      // Ensure proper paragraph spacing
      coverLetter = coverLetter.replace(/\n\n+/g, '\n\n');
      
      // Remove any potential markdown or code formatting
      coverLetter = coverLetter.replace(/```[\s\S]*?```/g, '');
      coverLetter = coverLetter.replace(/`([^`]+)`/g, '$1');
      
      // Clean up any asterisks or bullet points that shouldn't be there
      coverLetter = coverLetter.replace(/^\*\s+/gm, '');
      coverLetter = coverLetter.replace(/\s+\*\s+/g, ' ');
      
      // Final cleanup
      coverLetter = coverLetter.trim();
    }

    return coverLetter || 'Cover letter generation temporarily unavailable. Please write a personalized cover letter highlighting your relevant experience.';
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return 'Cover letter generation temporarily unavailable. Please write a personalized cover letter highlighting your relevant experience.';
  }
};

// Generate pre-filled application answers
const generateApplicationAnswers = async (jobData: JobData, userProfile: UserProfile) => {
  const prompt = `
Based on the job description and user profile, generate answers for common application questions:

JOB DETAILS:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Description: ${jobData.description}

USER PROFILE:
- Skills: ${userProfile.skills.join(', ')}
- Experience Level: ${userProfile.level || 'Not specified'}
- Experience: ${userProfile.experience || 'Not specified'}

Generate answers for these common questions:
1. "Why do you want to work for our company?"
2. "What are your greatest strengths?"
3. "Describe a challenging project you've worked on."
4. "Where do you see yourself in 5 years?"
5. "Why are you interested in this specific role?"

Requirements:
1. Provide concise, professional answers that highlight the user's qualifications and enthusiasm
2. Each answer should be 2-4 sentences long
3. Use specific examples from the user's profile when possible
4. Match the tone to be professional but approachable
5. Include relevant keywords from the job description
6. Ensure clean formatting with proper grammar and spacing

IMPORTANT FORMATTING RULES:
- Use clean, professional language
- No special characters or unicode symbols
- Proper sentence structure and grammar
- No regex patterns or code artifacts
- Modern, conversational yet professional tone
- Ensure the output is ready to copy-paste and use

Format the response as a JSON object with questions as keys and answers as values.
`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are helping a candidate prepare application answers. Ensure all output is clean, professional, and free of any special characters or formatting issues.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    let content = response.choices[0]?.message?.content || '';
    
    // Parse and clean the response
    let answers: Record<string, string> = {};
    
    if (content) {
      // First, try to parse as JSON
      try {
        answers = JSON.parse(content);
      } catch (e) {
        // If JSON parsing fails, extract answers manually
        const questions = [
          "Why do you want to work for our company?",
          "What are your greatest strengths?",
          "Describe a challenging project you've worked on.",
          "Where do you see yourself in 5 years?",
          "Why are you interested in this specific role?"
        ];
        
        questions.forEach(question => {
          const regex = new RegExp(`${question.replace(/[?]/g, '\\?')}\\s*[:\\n]\\s*([\\s\\S]*?)(?=\\n\\n|\\n[0-9]+\\.|$)`, 'i');
          const match = content.match(regex);
          if (match) {
            let answer = match[1].trim();
            // Clean up the answer
            answer = answer
              .replace(/\r\n/g, '\n')
              .replace(/\r/g, '\n')
              .replace(/\t+/g, ' ')
              .replace(/\s{2,}/g, ' ')
              .replace(/```[\s\S]*?```/g, '')
              .replace(/`([^`]+)`/g, '$1')
              .replace(/^\*\s+/gm, '')
              .replace(/\s+\*\s+/g, ' ')
              .trim();
            answers[question] = answer;
          } else {
            answers[question] = 'Please provide a personalized answer based on your experience and interest in this role.';
          }
        });
      }
      
      // Final cleanup of all answers
      Object.keys(answers).forEach(key => {
        answers[key] = answers[key]
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\n\n+/g, '\n\n')
          .trim();
      });
    }

    return answers;
  } catch (error) {
    console.error('Error generating application answers:', error);
    return {
      "Why do you want to work for our company?": "I'm excited about the opportunity to contribute my skills to a forward-thinking company like yours.",
      "What are your greatest strengths?": "My greatest strengths include [mention 2-3 key skills from your profile].",
      "Describe a challenging project you've worked on.": "I recently worked on a project where I [describe a relevant challenge and how you overcame it].",
      "Where do you see yourself in 5 years?": "In 5 years, I see myself growing into a senior role, taking on more responsibilities and mentoring others.",
      "Why are you interested in this specific role?": "This role aligns perfectly with my skills and career goals, particularly in [mention specific aspects]."
    };
  }
};

// Market intelligence data (simplified for demo)
const getMarketIntelligence = (jobTitle: string, company: string) => {
  // In a real implementation, this would fetch from job market APIs
  const titleLower = jobTitle.toLowerCase();
  
  // Determine salary range based on job title
  let salaryRange = 'R600k - R900k';
  if (titleLower.includes('senior') || titleLower.includes('lead')) {
    salaryRange = 'R800k - R1.2M';
  } else if (titleLower.includes('junior') || titleLower.includes('entry')) {
    salaryRange = 'R400k - R600k';
  } else if (titleLower.includes('principal') || titleLower.includes('staff')) {
    salaryRange = 'R1.2M - R1.8M';
  }
  
  // Determine demand level
  const highDemandRoles = ['software engineer', 'developer', 'data scientist', 'devops', 'cloud'];
  const demandLevel = highDemandRoles.some(role => titleLower.includes(role)) ? 'High' : 'Medium';
  
  // Extract key skills from job title
  const keySkills = [];
  if (titleLower.includes('software') || titleLower.includes('developer')) {
    keySkills.push('JavaScript', 'Python', 'React', 'Node.js');
  }
  if (titleLower.includes('data')) {
    keySkills.push('Python', 'SQL', 'Machine Learning', 'Statistics');
  }
  if (titleLower.includes('devops') || titleLower.includes('cloud')) {
    keySkills.push('AWS', 'Docker', 'Kubernetes', 'CI/CD');
  }
  
  return {
    salaryRange,
    demandLevel,
    keySkills: keySkills.length > 0 ? keySkills : ['Communication', 'Problem Solving', 'Teamwork']
  };
};

// Analyze skill gaps
const analyzeSkillGaps = (jobDescription: string, userSkills: string[]): string[] => {
  const requiredSkills: string[] = [];
  const gaps: string[] = [];
  
  // Common tech skills to look for
  const techSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'Git', 'CI/CD', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices'
  ];
  
  // Extract skills from job description
  const descriptionLower = jobDescription.toLowerCase();
  techSkills.forEach(skill => {
    if (descriptionLower.includes(skill.toLowerCase())) {
      requiredSkills.push(skill);
    }
  });
  
  // Find gaps
  requiredSkills.forEach(skill => {
    if (!userSkills.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())) {
      gaps.push(skill);
    }
  });
  
  const notes = [];
  if (gaps.length > 0) {
    notes.push(`Consider highlighting transferable skills for missing technical skills: ${gaps.join(', ')}`);
  }
  if (gaps.length > 3) {
    notes.push('You may want to consider upskilling in some of the required technologies before applying');
  }
  if (requiredSkills.length === 0) {
    notes.push('Job description doesn\'t clearly specify technical requirements - focus on soft skills and experience');
  }
  
  return notes;
};

export async function POST(request: NextRequest) {
  try {
    // Try to get auth, but handle gracefully if middleware is disabled
    let clerkId = null;
    try {
      const authResult = await auth();
      clerkId = authResult.userId;
    } catch (error) {
      console.log('[Application Prep] Auth not available, proceeding without user validation');
    }
    
    // For development, allow requests without auth when middleware is disabled
    if (!clerkId && process.env.NODE_ENV === 'development') {
      console.log('[Application Prep] Development mode: proceeding without auth');
    } else if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobData, userProfile, cvText } = await request.json() as {
      jobData: JobData;
      userProfile: UserProfile;
      cvText?: string;
    };

    if (!jobData || !jobData.title || !jobData.company || !jobData.description) {
      return NextResponse.json(
        { error: 'Job title, company, and description are required' },
        { status: 400 }
      );
    }

    // Get user from database (skip if auth is disabled in development)
    let user = null;
    if (clerkId) {
      user = await prisma.user.findUnique({
        where: { clerkId }
      });
    }

    if (!user && clerkId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Application Prep] Starting package generation for:', jobData.title);

    // Generate all components in parallel
    const [
      marketInsights,
      skillGapNotes,
      tailoredCV,
      coverLetter,
      applicationAnswers
    ] = await Promise.all([
      Promise.resolve(getMarketIntelligence(jobData.title, jobData.company)),
      Promise.resolve(analyzeSkillGaps(jobData.description, userProfile.skills)),
      generateTailoredCV(jobData, userProfile, cvText),
      generateCoverLetter(jobData, userProfile, cvText),
      generateApplicationAnswers(jobData, userProfile)
    ]);

    const applicationPackage = {
      tailoredCV,
      coverLetter,
      applicationAnswers,
      skillGapNotes,
      marketInsights
    };

    console.log('[Application Prep] Package generated successfully');

    return NextResponse.json({
      success: true,
      ...applicationPackage
    });

  } catch (error) {
    console.error('[Application Prep] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate application package' },
      { status: 500 }
    );
  }
}
