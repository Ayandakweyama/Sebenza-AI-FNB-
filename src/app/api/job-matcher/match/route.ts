import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { parseCV, extractSkillsFromCV } from '@/lib/cvParser';
import { cvService } from '@/lib/ai/cvService';

export const maxDuration = 120; // 120 seconds (2 minutes) max for faster response
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MatchedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  description?: string;
  source: string;
  matchScore: number;
  feedbackLikelihood: number;
  matchReason: string;
  missingSkills?: string[];
  matchingSkills?: string[];
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cvText, query, location = 'South Africa', yearsOfExperience, maxResults = 20 } = body;

    if (!cvText) {
      return NextResponse.json({ error: 'CV text is required' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    console.log('[Job Matcher] Starting job matching process');
    console.log('[Job Matcher] Query:', query);
    console.log('[Job Matcher] Location:', location);
    console.log('[Job Matcher] Years of Experience:', yearsOfExperience || 'Not specified');

    // Parse years of experience to numeric value for comparison
    const parseExperienceYears = (exp: string): number => {
      if (!exp) return 0;
      if (exp === '10+') return 10;
      if (exp.includes('-')) {
        const [min, max] = exp.split('-').map(Number);
        return (min + max) / 2;
      }
      return parseInt(exp) || 0;
    };

    const userExperienceYears = parseExperienceYears(yearsOfExperience);

    // Skill descriptions for better user understanding
    const skillDescriptions: Record<string, { description: string; category: string }> = {
      'JavaScript': { description: 'Core programming language for web development', category: 'Programming' },
      'TypeScript': { description: 'Typed superset of JavaScript for better code quality', category: 'Programming' },
      'Python': { description: 'Versatile language for data science, AI, and backend', category: 'Programming' },
      'Java': { description: 'Enterprise-grade language for large-scale applications', category: 'Programming' },
      'C#': { description: 'Microsoft language for .NET applications', category: 'Programming' },
      'React': { description: 'Popular JavaScript library for building user interfaces', category: 'Frontend' },
      'Angular': { description: 'Framework for building single-page applications', category: 'Frontend' },
      'Vue': { description: 'Progressive framework for building user interfaces', category: 'Frontend' },
      'Node.js': { description: 'JavaScript runtime for server-side development', category: 'Backend' },
      'Docker': { description: 'Containerization platform for application deployment', category: 'DevOps' },
      'Kubernetes': { description: 'Container orchestration for scaling applications', category: 'DevOps' },
      'AWS': { description: 'Amazon Web Services cloud platform', category: 'Cloud' },
      'Azure': { description: 'Microsoft Azure cloud platform', category: 'Cloud' },
      'PostgreSQL': { description: 'Advanced open-source relational database', category: 'Database' },
      'MongoDB': { description: 'NoSQL document database for flexible data storage', category: 'Database' },
      'Git': { description: 'Version control system for code collaboration', category: 'Tools' },
      'Agile': { description: 'Project management methodology for iterative development', category: 'Methodology' },
      'Scrum': { description: 'Agile framework for team collaboration', category: 'Methodology' },
      'REST API': { description: 'Standard architecture for web services', category: 'Backend' },
      'GraphQL': { description: 'Query language for APIs with flexible data fetching', category: 'Backend' },
      'SQL': { description: 'Standard language for relational database queries', category: 'Database' },
      'Linux': { description: 'Operating system for servers and development', category: 'OS' },
      'HTML': { description: 'Markup language for web page structure', category: 'Frontend' },
      'CSS': { description: 'Styling language for web page presentation', category: 'Frontend' },
      'PHP': { description: 'Server-side scripting language for web development', category: 'Backend' },
      'Ruby': { description: 'Dynamic language for web development (Ruby on Rails)', category: 'Programming' },
      'Go': { description: 'Google language for high-performance systems', category: 'Programming' },
      'Swift': { description: 'Apple language for iOS development', category: 'Mobile' },
      'Kotlin': { description: 'Modern language for Android development', category: 'Mobile' },
      'Flutter': { description: 'Framework for cross-platform mobile development', category: 'Mobile' },
      'TensorFlow': { description: 'Machine learning framework by Google', category: 'AI/ML' },
      'PyTorch': { description: 'Deep learning framework by Facebook', category: 'AI/ML' },
      'Machine Learning': { description: 'AI subset for pattern recognition and predictions', category: 'AI/ML' },
      'Data Science': { description: 'Field of extracting insights from data', category: 'AI/ML' },
      'CI/CD': { description: 'Automated integration and deployment pipelines', category: 'DevOps' },
      'Jenkins': { description: 'Automation server for CI/CD pipelines', category: 'DevOps' },
      'Terraform': { description: 'Infrastructure as Code tool for cloud provisioning', category: 'DevOps' },
    };

    // Extract experience requirements from job description
    const extractExperienceRequirement = (description: string): number | null => {
      if (!description) return null;
      
      const descLower = description.toLowerCase();
      
      // Look for patterns like "3+ years", "5 years experience", "3-5 years"
      const patterns = [
        /(\d+)\+?\s*years?\s*(of\s*)?experience/i,
        /(\d+)-(\d+)\s*years?\s*(of\s*)?experience/i,
        /(\d+)\s*years?\s*(of\s*)?experience/i,
        /senior/i,
        /junior/i,
        /mid[-\s]?level/i,
        /entry[-\s]?level/i,
        /lead/i,
        /principal/i,
      ];

      for (const pattern of patterns) {
        const match = descLower.match(pattern);
        if (match) {
          // If it's a number pattern
          if (match[1] && !isNaN(parseInt(match[1]))) {
            if (match[2]) {
              // Range like "3-5 years"
              return (parseInt(match[1]) + parseInt(match[2])) / 2;
            }
            return parseInt(match[1]);
          }
          
          // If it's a keyword pattern
          if (match[0].includes('senior') || match[0].includes('lead') || match[0].includes('principal')) {
            return 7; // Senior roles typically require 7+ years
          }
          if (match[0].includes('mid')) {
            return 4; // Mid-level typically requires 3-5 years
          }
          if (match[0].includes('junior') || match[0].includes('entry')) {
            return 1; // Junior/entry typically requires 0-2 years
          }
        }
      }
      
      return null; // No experience requirement found
    };

    // Calculate experience match score (0-100)
    const calculateExperienceMatch = (jobDescription: string): number => {
      if (!yearsOfExperience) return 100; // No user experience specified, don't penalize
      
      const requiredYears = extractExperienceRequirement(jobDescription);
      if (requiredYears === null) return 100; // No requirement found, don't penalize
      
      const diff = userExperienceYears - requiredYears;
      
      // Perfect match or slightly under/over
      if (Math.abs(diff) <= 1) return 100;
      
      // Slightly underqualified but close
      if (diff >= -2 && diff < -1) return 85;
      
      // Slightly overqualified
      if (diff > 1 && diff <= 3) return 90;
      
      // Significantly underqualified
      if (diff < -2) return Math.max(40, 60 + (diff * 10));
      
      // Significantly overqualified
      if (diff > 3) return Math.max(50, 90 - (diff * 5));
      
      return 70; // Default
    };

    // Parse CV to extract user data
    console.log('[Job Matcher] Parsing CV...');
    const parsedCV = parseCV(cvText);
    const extractedSkills = extractSkillsFromCV(cvText);
    
    console.log('[Job Matcher] Extracted skills:', extractedSkills);
    console.log('[Job Matcher] Experience entries:', parsedCV.experience.length);
    console.log('[Job Matcher] Education entries:', parsedCV.education.length);

    // Scrape jobs from multiple sources
    console.log('[Job Matcher] Scraping jobs from multiple sources...');
    // Using only jobmail and indeed for fastest and most reliable results
    const sources = ['jobmail', 'indeed'] as const;
    
    const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scrape-multi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        location,
        maxPages: 1, // Reduced to 1 page for faster loading
        sources,
      }),
    });

    if (!scrapeResponse.ok) {
      console.error('[Job Matcher] Failed to scrape jobs:', scrapeResponse.statusText);
      return NextResponse.json({ error: 'Failed to scrape jobs' }, { status: 500 });
    }

    const scrapeData = await scrapeResponse.json();
    const jobs = scrapeData.jobs || [];
    
    console.log(`[Job Matcher] Scraped ${jobs.length} jobs from ${sources.length} sources`);
    console.log('[Job Matcher] Source breakdown:', scrapeData.sourceCounts);
    console.log('[Job Matcher] Errors:', scrapeData.errors);

    if (jobs.length === 0) {
      return NextResponse.json({
        matchedJobs: [],
        message: 'No jobs found matching your criteria',
      });
    }

    // Match each job against the CV using AI
    console.log('[Job Matcher] Matching jobs against CV...');
    const matchedJobs: MatchedJob[] = [];
    
    // Process jobs in batches to avoid overwhelming the AI
    const batchSize = 5;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      const matchPromises = batch.map(async (job: any) => {
        try {
          // Use AI to evaluate match and feedback likelihood
          const matchPrompt = `You are an expert job matching AI. Evaluate how well this candidate matches the job and estimate their likelihood of receiving feedback from the employer.

Candidate CV Summary:
Name: ${parsedCV.personalInfo.name || 'Unknown'}
Skills: ${extractedSkills.join(', ')}
Experience: ${parsedCV.experience.map(e => `${e.position} at ${e.company}`).join('; ')}
Education: ${parsedCV.education.map(e => `${e.degree} from ${e.institution}`).join('; ')}

Job Details:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description || 'No description available'}

Evaluate the match and provide a JSON response with:
- matchScore: A score from 0-100 indicating how well the candidate matches the job
- feedbackLikelihood: A score from 0-100 estimating the likelihood of hearing back from the employer (consider factors like skill match, experience level, job market competition)
- matchReason: A brief explanation (2-3 sentences) of why this is a good or bad match
- matchingSkills: Array of skills from the candidate that match the job requirements
- missingSkills: Array of important skills mentioned in the job that the candidate lacks

Be realistic and conservative with feedback likelihood scores.`;

          const aiResponse = await cvService.analyzeResume(
            cvText,
            job.title
          );

          // Extract additional matching skills from job description
          const jobDescLower = (job.description || '').toLowerCase();
          
          // Enhanced matching skills with context
          const matchingSkillsWithDetails = extractedSkills
            .filter(skill => jobDescLower.includes(skill.toLowerCase()))
            .map(skill => ({
              name: skill,
              description: skillDescriptions[skill]?.description || 'Technical skill',
              category: skillDescriptions[skill]?.category || 'General',
              context: `Found in job requirements`,
            }));
          
          // Find skills in job description that candidate doesn't have
          const allTechSkills = Object.keys(skillDescriptions);
          const missingSkillsWithDetails = allTechSkills
            .filter(skill => 
              jobDescLower.includes(skill.toLowerCase()) && 
              !extractedSkills.some(s => s.toLowerCase() === skill.toLowerCase())
            )
            .map(skill => ({
              name: skill,
              description: skillDescriptions[skill]?.description || 'Technical skill required for this role',
              category: skillDescriptions[skill]?.category || 'General',
              importance: 'high',
              reason: `This skill is mentioned in the job description and is important for success in this role`,
            }));

          // Calculate heuristic score based on skill matching
          const skillMatchRatio = matchingSkillsWithDetails.length > 0 
            ? Math.min((matchingSkillsWithDetails.length / Math.max(matchingSkillsWithDetails.length + missingSkillsWithDetails.length, 1)) * 100, 100)
            : 30; // Default 30% if no skills detected
          
          const heuristicScore = Math.round(skillMatchRatio);
          
          // Calculate experience match
          const experienceMatch = calculateExperienceMatch(job.description || '');
          
          // Use AI score if it's reasonable (20+), otherwise use heuristic
          let finalMatchScore = aiResponse.score;
          if (finalMatchScore < 20) {
            finalMatchScore = Math.max(heuristicScore, 25); // Minimum 25%
            console.log(`[Job Matcher] AI score too low (${aiResponse.score}), using heuristic: ${finalMatchScore}`);
          } else {
            // Blend AI score with heuristic for more balanced result
            finalMatchScore = Math.round((aiResponse.score * 0.5) + (heuristicScore * 0.3) + (experienceMatch * 0.2));
          }

          // Ensure score is within valid range
          finalMatchScore = Math.max(25, Math.min(100, finalMatchScore));
          
          // Calculate feedback likelihood based on match score with some optimism
          const feedbackLikelihood = Math.min(finalMatchScore + 15, 95);

          console.log(`[Job Matcher] Score calculation for "${job.title}":`, {
            aiScore: aiResponse.score,
            heuristicScore,
            experienceMatch,
            finalMatchScore,
            feedbackLikelihood,
            matchingSkills: matchingSkillsWithDetails.length,
            missingSkills: missingSkillsWithDetails.length
          });

          return {
            ...job,
            matchScore: finalMatchScore,
            feedbackLikelihood,
            matchReason: aiResponse.strengths.length > 0 
              ? aiResponse.strengths.slice(0, 2).join('; ') 
              : matchingSkillsWithDetails.length > 0
              ? `${matchingSkillsWithDetails.length} matching skills found`
              : 'Skills and experience may align with job requirements',
            matchingSkills: matchingSkillsWithDetails,
            missingSkills: missingSkillsWithDetails.slice(0, 5),
          };
        } catch (error) {
          console.error('[Job Matcher] Error matching job:', job.title, error);
          
          // Calculate basic skill match as fallback
          const jobDescLower = (job.description || '').toLowerCase();
          const matchingSkillsSimple = extractedSkills.filter(skill => 
            jobDescLower.includes(skill.toLowerCase())
          );
          
          // Convert to detailed format
          const matchingSkillsWithDetails = matchingSkillsSimple.map(skill => ({
            name: skill,
            description: skillDescriptions[skill]?.description || 'Technical skill',
            category: skillDescriptions[skill]?.category || 'General',
            context: 'Found in job requirements',
          }));
          
          // Calculate experience match
          const experienceMatch = calculateExperienceMatch(job.description || '');
          
          // Calculate fallback score based on skill matching and experience
          const skillScore = matchingSkillsSimple.length > 0 
            ? Math.min(30 + (matchingSkillsSimple.length * 10), 75)
            : 35;
          
          const fallbackScore = Math.round((skillScore * 0.6) + (experienceMatch * 0.4));
          
          // Return a default match with calculated fallback scores
          return {
            ...job,
            matchScore: fallbackScore,
            feedbackLikelihood: Math.min(fallbackScore + 10, 80),
            matchReason: 'Basic skill and experience match analysis performed',
            matchingSkills: matchingSkillsWithDetails,
            missingSkills: [],
          };
        }
      });

      const batchResults = await Promise.all(matchPromises);
      matchedJobs.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Sort by feedback likelihood (primary) and match score (secondary)
    matchedJobs.sort((a, b) => {
      if (b.feedbackLikelihood !== a.feedbackLikelihood) {
        return b.feedbackLikelihood - a.feedbackLikelihood;
      }
      return b.matchScore - a.matchScore;
    });

    // Return top results
    const topMatches = matchedJobs.slice(0, maxResults);

    console.log(`[Job Matcher] Returning ${topMatches.length} matched jobs`);

    // Save matching results to database (optional)
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: session.userId },
      });

      if (user) {
        // Could save job matching history here
        console.log('[Job Matcher] User found, could save match history');
      }
    } catch (dbError) {
      console.warn('[Job Matcher] Database error (non-critical):', dbError);
    }

    return NextResponse.json({
      matchedJobs: topMatches,
      totalScraped: jobs.length,
      sourcesUsed: ['jobmail', 'indeed'],
      candidateProfile: {
        skills: extractedSkills,
        experienceCount: parsedCV.experience.length,
        educationCount: parsedCV.education.length,
        yearsOfExperience: yearsOfExperience || 'Not specified',
      },
    });
  } catch (error) {
    console.error('[Job Matcher] Error:', error);
    return NextResponse.json(
      { error: 'Failed to match jobs' },
      { status: 500 }
    );
  }
}
