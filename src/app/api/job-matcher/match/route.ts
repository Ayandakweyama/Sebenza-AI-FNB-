import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { parseCV, extractSkillsFromCV } from '@/lib/cvParser';
import { cvService } from '@/lib/ai/cvService';
import { scrapeIndeed, scrapeJobMail } from '@/lib/scrapers';
import type { ScraperConfig, Job } from '@/lib/scrapers/types';
import { jobCache } from '@/lib/cache/jobCache';

export const maxDuration = 300; // 5 minutes - needed for sequential scrapers with retries on Railway
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

    // Scrape jobs directly (no HTTP fetch — avoids Railway internal URL issues)
    console.log('[Job Matcher] Scraping jobs directly from scrapers...');
    const sources = ['indeed', 'jobmail'] as const;
    const scraperConfig: ScraperConfig = { query, location, maxPages: 1 };
    
    // Check cache first
    const cachedJobs = jobCache.get(query, location, sources as any);
    let jobs: Job[] = [];
    let sourceCounts: Record<string, number> = {};
    let scrapeErrors: string[] = [];

    // Skip cache if any requested source has 0 jobs (stale cache from failed scrape)
    const cacheHasAllSources = cachedJobs && cachedJobs.length > 0 && 
      sources.every(s => cachedJobs.some(j => j.source === s));
    if (cacheHasAllSources) {
      console.log(`[Job Matcher] Cache hit! ${cachedJobs.length} cached jobs`);
      jobs = cachedJobs;
      sourceCounts = sources.reduce((acc, s) => {
        acc[s] = cachedJobs.filter(j => j.source === s).length;
        return acc;
      }, {} as Record<string, number>);
    } else {
      // Run scrapers SEQUENTIALLY to avoid Puppeteer browser resource conflicts
      const allJobs: Job[] = [];
      const timeoutMs = 60000;

      for (const source of sources) {
        const maxAttempts = source === 'indeed' ? 2 : 1; // Retry Indeed once if it fails
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.log(`[Job Matcher] Starting ${source} scraper (attempt ${attempt}/${maxAttempts})...`);
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error(`${source} scraper timed out`)), timeoutMs)
          );
          try {
            let result;
            if (source === 'indeed') {
              result = await Promise.race([scrapeIndeed(scraperConfig), timeoutPromise]);
            } else if (source === 'jobmail') {
              result = await Promise.race([scrapeJobMail(scraperConfig), timeoutPromise]);
            } else {
              scrapeErrors.push(`Unknown source: ${source}`);
              break;
            }
            const r = result as any;
            if (r && r.success && r.jobs?.length > 0) {
              allJobs.push(...r.jobs);
              sourceCounts[r.source] = r.count;
              console.log(`[Job Matcher] ✅ ${r.source}: ${r.count} jobs`);
              break; // Success, no retry needed
            } else {
              const errMsg = `${source}: ${r?.error || (r?.jobs?.length === 0 ? '0 jobs returned' : 'Unknown error')}`;
              if (attempt < maxAttempts) {
                console.warn(`[Job Matcher] ⚠️ ${errMsg} — retrying...`);
                await new Promise(r => setTimeout(r, 3000));
              } else {
                scrapeErrors.push(errMsg);
                console.error(`[Job Matcher] ❌ ${errMsg}`);
              }
            }
          } catch (error) {
            const errMsg = `${source}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            if (attempt < maxAttempts) {
              console.warn(`[Job Matcher] ⚠️ ${errMsg} — retrying...`);
              await new Promise(r => setTimeout(r, 3000));
            } else {
              scrapeErrors.push(errMsg);
              console.error(`[Job Matcher] ❌ ${source} failed:`, error instanceof Error ? error.message : error);
            }
          }
        }
        // Brief pause between scrapers for browser cleanup
        await new Promise(r => setTimeout(r, 2000));
      }

      // Deduplicate
      jobs = allJobs.filter((job, index, self) => {
        const id = job.url || `${job.title}-${job.company}-${job.location}`;
        return self.findIndex(j => (j.url || `${j.title}-${j.company}-${j.location}`) === id) === index;
      });

      // Cache results
      if (jobs.length > 0) {
        jobCache.set(query, location, sources as any, jobs);
      }
    }

    console.log(`[Job Matcher] Scraped ${jobs.length} unique jobs from ${sources.length} sources`);
    console.log('[Job Matcher] Source breakdown:', sourceCounts);
    if (scrapeErrors.length > 0) console.log('[Job Matcher] Errors:', scrapeErrors);

    if (jobs.length === 0) {
      console.log('[Job Matcher] No jobs found, returning empty result');
      return NextResponse.json({
        matchedJobs: [],
        message: scrapeErrors.length > 0 
          ? `No jobs found. Errors: ${scrapeErrors.join(', ')}` 
          : 'No jobs found matching your criteria',
        sourceCounts,
        errors: scrapeErrors,
      });
    }

    // Match each job against the CV using heuristic matching (fast, no per-job AI calls)
    console.log('[Job Matcher] Matching jobs against CV using heuristic analysis...');
    const matchedJobs: MatchedJob[] = [];
    
    // Optionally call AI once for overall CV assessment (non-blocking, used as enhancement if available)
    let aiCvAssessment: { strengths: string[]; areasForImprovement: string[] } | null = null;
    try {
      console.log('[Job Matcher] Requesting AI CV assessment (single call)...');
      const aiResponse = await Promise.race([
        cvService.analyzeResume(cvText, query),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('AI assessment timed out')), 15000))
      ]) as any;
      if (aiResponse && aiResponse.strengths) {
        aiCvAssessment = { strengths: aiResponse.strengths, areasForImprovement: aiResponse.areasForImprovement };
        console.log('[Job Matcher] AI CV assessment received');
      }
    } catch (aiError) {
      console.warn('[Job Matcher] AI assessment unavailable, using heuristic-only matching:', aiError instanceof Error ? aiError.message : 'Unknown');
    }
    
    // Match all jobs using fast heuristic scoring
    for (let jobIdx = 0; jobIdx < jobs.length; jobIdx++) {
      const job = jobs[jobIdx];
      try {
        const jobDescLower = (job.description || job.title || '').toLowerCase();
        
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
            importance: 'high' as const,
            reason: `This skill is mentioned in the job description and is important for success in this role`,
          }));

        // Calculate heuristic score based on skill matching
        const skillMatchRatio = matchingSkillsWithDetails.length > 0 
          ? Math.min((matchingSkillsWithDetails.length / Math.max(matchingSkillsWithDetails.length + missingSkillsWithDetails.length, 1)) * 100, 100)
          : 30; // Default 30% if no skills detected
        
        const heuristicScore = Math.round(skillMatchRatio);
        
        // Calculate experience match
        const experienceMatch = calculateExperienceMatch(job.description || '');
        
        // Calculate title relevance bonus (0-100 scale)
        const titleLower = (job.title || '').toLowerCase();
        const queryLower = query.toLowerCase();
        const titleRelevance = titleLower.includes(queryLower) ? 100 : 
          queryLower.split(/\s+/).some(word => titleLower.includes(word)) ? 50 : 0;
        
        // Blend heuristic score with experience match
        let finalMatchScore = Math.round((heuristicScore * 0.6) + (experienceMatch * 0.3) + (titleRelevance * 0.1));
        
        // Ensure score is within valid range
        finalMatchScore = Math.max(25, Math.min(100, finalMatchScore));
        
        // Calculate feedback likelihood based on match score
        const feedbackLikelihood = Math.min(finalMatchScore + 10, 95);

        // Build match reason
        const matchReason = matchingSkillsWithDetails.length > 0
          ? `${matchingSkillsWithDetails.length} matching skill${matchingSkillsWithDetails.length > 1 ? 's' : ''} found${aiCvAssessment ? '; ' + aiCvAssessment.strengths.slice(0, 1).join(', ') : ''}`
          : aiCvAssessment 
            ? aiCvAssessment.strengths.slice(0, 2).join('; ') || 'Skills and experience may align with job requirements'
            : 'Skills and experience may align with job requirements';

        matchedJobs.push({
          ...job,
          id: job.id || `${job.source}-${jobIdx}`,
          matchScore: finalMatchScore,
          feedbackLikelihood,
          matchReason,
          matchingSkills: matchingSkillsWithDetails,
          missingSkills: missingSkillsWithDetails.slice(0, 5),
        });
      } catch (error) {
        console.error('[Job Matcher] Error matching job:', job.title, error);
        // Still include the job with a default score
        matchedJobs.push({
          ...job,
          id: job.id || `${job.source}-${jobIdx}`,
          matchScore: 35,
          feedbackLikelihood: 45,
          matchReason: 'Basic match analysis performed',
          matchingSkills: [],
          missingSkills: [],
        });
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
    console.error('[Job Matcher] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to match jobs', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
