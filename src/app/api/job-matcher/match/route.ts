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
      'Deep Learning': { description: 'Neural network-based AI for complex pattern recognition', category: 'AI/ML' },
      'Data Science': { description: 'Field of extracting insights from data', category: 'AI/ML' },
      'NLP': { description: 'Natural Language Processing for text and speech AI', category: 'AI/ML' },
      'Computer Vision': { description: 'AI for interpreting visual data from images/video', category: 'AI/ML' },
      'Generative AI': { description: 'AI models that generate text, images, or code', category: 'AI/ML' },
      'LLM': { description: 'Large Language Models like GPT and Claude', category: 'AI/ML' },
      'OpenAI': { description: 'OpenAI API for GPT models and AI features', category: 'AI/ML' },
      'LangChain': { description: 'Framework for building LLM-powered applications', category: 'AI/ML' },
      'Hugging Face': { description: 'Open-source ML models and transformers library', category: 'AI/ML' },
      'Data Analysis': { description: 'Statistical analysis and insights from datasets', category: 'Data' },
      'Data Engineering': { description: 'Building data pipelines and infrastructure', category: 'Data' },
      'Power BI': { description: 'Microsoft business intelligence and analytics tool', category: 'Data' },
      'Tableau': { description: 'Data visualisation and business intelligence platform', category: 'Data' },
      'ETL': { description: 'Extract, Transform, Load processes for data pipelines', category: 'Data' },
      'Kafka': { description: 'Distributed event streaming platform', category: 'Data' },
      'Spark': { description: 'Apache Spark for large-scale data processing', category: 'Data' },
      'Business Intelligence': { description: 'BI tools and reporting for business insights', category: 'Data' },
      'SAP': { description: 'Enterprise resource planning software suite', category: 'Enterprise' },
      'Salesforce': { description: 'CRM and cloud platform for sales/service', category: 'Enterprise' },
      'Dynamics 365': { description: 'Microsoft ERP and CRM platform', category: 'Enterprise' },
      'React Native': { description: 'Cross-platform mobile development with React', category: 'Mobile' },
      'Ionic': { description: 'Hybrid mobile app framework using web technologies', category: 'Mobile' },
      'CI/CD': { description: 'Automated integration and deployment pipelines', category: 'DevOps' },
      'Jenkins': { description: 'Automation server for CI/CD pipelines', category: 'DevOps' },
      'Terraform': { description: 'Infrastructure as Code tool for cloud provisioning', category: 'DevOps' },
      'GCP': { description: 'Google Cloud Platform services', category: 'Cloud' },
      'PL/SQL': { description: 'Oracle procedural extension to SQL for stored procedures', category: 'Database' },
      'T-SQL': { description: 'Microsoft SQL Server procedural extension to SQL', category: 'Database' },
      'Project Management': { description: 'Planning and executing projects on time and budget', category: 'Management' },
      'Cybersecurity': { description: 'Protecting systems and data from digital attacks', category: 'Security' },
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
    let scraperDiagnostics: Record<string, any> = {};

    // Use cache if it has a meaningful number of jobs (scraper sources may return careerjunction/careers24 labels)
    const cacheHasAllSources = cachedJobs && cachedJobs.length > 0;
    if (cacheHasAllSources) {
      console.log(`[Job Matcher] Cache hit! ${cachedJobs.length} cached jobs`);
      jobs = cachedJobs;
      sourceCounts = cachedJobs.reduce((acc, j) => {
        acc[j.source] = (acc[j.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    } else {
      // Run scrapers SEQUENTIALLY to avoid Puppeteer browser resource conflicts
      const allJobs: Job[] = [];
      const timeoutMs = 120000; // 120s — indeed tries 3 SA sites (CJ + C24 + Jobs.co.za) before falling back

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
            if (r && r.diagnostics) {
              scraperDiagnostics[r.source || source] = r.diagnostics;
            }
            if (r && r.success && r.jobs?.length > 0) {
              allJobs.push(...r.jobs);
              // Count by actual job.source labels (CJ/C24 differ from ScraperResult.source 'indeed')
              for (const j of r.jobs as Job[]) {
                sourceCounts[j.source] = (sourceCounts[j.source] || 0) + 1;
              }
              console.log(`[Job Matcher] ✅ ${r.source}: ${r.count} jobs (sources: ${JSON.stringify(sourceCounts)})`);
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

      // Filter out jobs with no usable URL, then deduplicate
      const validJobs = allJobs.filter(job => {
        const u = (job.url || '').trim();
        return u && u !== '#' && u.startsWith('http') && u.length > 15;
      });
      jobs = validJobs.filter((job, index, self) => {
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
        totalScraped: 0,
        sourcesUsed: [],
        message: scrapeErrors.length > 0 
          ? `No jobs found. Errors: ${scrapeErrors.join(', ')}` 
          : 'No jobs found matching your criteria',
        sourceCounts,
        errors: scrapeErrors,
        diagnostics: scraperDiagnostics,
        candidateProfile: {
          skills: extractedSkills,
          experienceCount: parsedCV.experience.length,
          educationCount: parsedCV.education.length,
          yearsOfExperience: yearsOfExperience || 'Not specified',
        },
      });
    }

    // Build a CV profile keyword set for cross-referencing against job titles
    // Combines extracted skills + experience position titles + experience descriptions + CV summary + full CV text
    const cvProfileText = [
      ...extractedSkills,
      ...parsedCV.experience.map(e => `${e.position || ''} ${e.description || ''}`),
      parsedCV.summary || '',
      cvText,
    ].join(' ').toLowerCase();

    // Stop-words to ignore when comparing job title words to CV
    const stopWords = new Set(['with', 'from', 'this', 'that', 'have', 'will', 'your', 'their',
      'they', 'been', 'were', 'about', 'into', 'over', 'after', 'under', 'each', 'both',
      'more', 'also', 'than', 'then', 'only', 'some', 'such', 'when', 'while', 'where',
      'jobs', 'role', 'position', 'vacancy', 'opportunity', 'based']);

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
        // Always combine title + description for maximum matching surface
        const jobTextLower = ((job.title || '') + ' ' + (job.description || '')).toLowerCase();
        const hasRichDescription = (job.description || '').trim().length > 100;
        
        // Enhanced matching skills with context (title + description)
        const matchingSkillsWithDetails = extractedSkills
          .filter(skill => jobTextLower.includes(skill.toLowerCase()))
          .map(skill => ({
            name: skill,
            description: skillDescriptions[skill]?.description || 'Technical skill',
            category: skillDescriptions[skill]?.category || 'General',
            context: `Found in job requirements`,
          }));
        
        // Find skills in job text that candidate doesn't have
        const allTechSkills = Object.keys(skillDescriptions);
        const missingSkillsWithDetails = allTechSkills
          .filter(skill => 
            jobTextLower.includes(skill.toLowerCase()) && 
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
        const totalSkillsInJob = matchingSkillsWithDetails.length + missingSkillsWithDetails.length;
        const skillMatchRatio = totalSkillsInJob > 0
          ? Math.min((matchingSkillsWithDetails.length / totalSkillsInJob) * 100, 100)
          : 0;
        const heuristicScore = Math.round(skillMatchRatio);
        
        // Calculate experience match — combine title + description so "Senior" in title counts
        const experienceMatch = calculateExperienceMatch(`${job.title || ''} ${job.description || ''}`);
        
        // Richer title relevance: score by query word coverage ratio
        const titleLower = (job.title || '').toLowerCase();
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        const matchedQueryWords = queryWords.filter(word => titleLower.includes(word)).length;
        const queryWordCoverage = queryWords.length > 0 ? matchedQueryWords / queryWords.length : 0;
        const titleRelevance = titleLower.includes(queryLower) ? 100
          : queryWordCoverage >= 0.75 ? 85
          : queryWordCoverage >= 0.5 ? 70
          : queryWordCoverage >= 0.25 ? 45
          : 0;
        
        // Score job title words against the CV profile text
        // This ranks jobs by CV relevance, not just by query match
        const jobTitleWords = titleLower
          .split(/[\s\-\/,]+/)
          .filter(w => w.length > 2 && !stopWords.has(w));
        const titleWordsInCV = jobTitleWords.filter(word => cvProfileText.includes(word)).length;
        const cvTitleAlignment = jobTitleWords.length > 0
          ? (titleWordsInCV / jobTitleWords.length) * 100
          : 0;

        let finalMatchScore: number;
        if (hasRichDescription && totalSkillsInJob > 0) {
          // Rich description + skill data: proper weighted blend
          finalMatchScore = Math.round(
            (heuristicScore * 0.45) +
            (cvTitleAlignment * 0.25) +
            (experienceMatch * 0.20) +
            (titleRelevance * 0.10)
          );
        } else {
          // Sparse description: heavily weight CV-title alignment
          const skillBonus = Math.min(matchingSkillsWithDetails.length * 12, 35);
          finalMatchScore = Math.round(
            (cvTitleAlignment * 0.50) +
            (titleRelevance * 0.25) +
            (experienceMatch * 0.15) +
            skillBonus
          );
        }
        
        // Ensure score is within valid range (no artificial floor — let relevance speak)
        finalMatchScore = Math.max(5, Math.min(100, finalMatchScore));
        
        // Calculate feedback likelihood based on match score
        const feedbackLikelihood = Math.min(finalMatchScore + 10, 95);

        // Build match reason — be specific about what drove the score
        const topMatchedSkills = matchingSkillsWithDetails.slice(0, 4).map(s => s.name).join(', ');
        const cvAlignLabel = cvTitleAlignment >= 75 ? 'strong' : cvTitleAlignment >= 40 ? 'good' : 'partial';
        let matchReason: string;
        if (matchingSkillsWithDetails.length > 0 && cvTitleAlignment >= 40) {
          matchReason = `${matchingSkillsWithDetails.length} matching skill${matchingSkillsWithDetails.length > 1 ? 's' : ''} (${topMatchedSkills}) · ${cvAlignLabel} CV-title alignment`;
        } else if (matchingSkillsWithDetails.length > 0) {
          matchReason = `Matched skills: ${topMatchedSkills}`;
        } else if (cvTitleAlignment >= 50) {
          const expTitle = parsedCV.experience[0]?.position;
          matchReason = `${cvAlignLabel} title alignment with your ${expTitle ? expTitle + ' ' : ''}background (${Math.round(cvTitleAlignment)}% keyword overlap)`;
        } else if (titleRelevance >= 70) {
          matchReason = `Job title matches your search query`;
        } else if (aiCvAssessment) {
          matchReason = aiCvAssessment.strengths.slice(0, 2).join('; ') || 'May align with your background';
        } else {
          matchReason = 'Limited overlap with CV — review job details';
        }

        console.log(`[Match] "${job.title}" (${job.source}): score=${finalMatchScore}% cvAlign=${Math.round(cvTitleAlignment)}% titleRel=${titleRelevance}% exp=${experienceMatch}% skills=${matchingSkillsWithDetails.length}`);

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

    // Filter out clearly irrelevant results (score below 30%), then return top N
    const relevantJobs = matchedJobs.filter(j => j.matchScore >= 30);
    const topMatches = (relevantJobs.length > 0 ? relevantJobs : matchedJobs).slice(0, maxResults);

    console.log(`[Job Matcher] Returning ${topMatches.length} matched jobs (filtered from ${matchedJobs.length}, ${matchedJobs.length - (relevantJobs?.length ?? matchedJobs.length)} below 30% threshold)`);
    if (topMatches.length > 0) {
      console.log('[Job Matcher] Top 5 scores:', topMatches.slice(0, 5).map(j => `"${j.title}" ${j.matchScore}%`).join(' | '));
    }

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
      sourcesUsed: [...new Set(jobs.map(j => j.source))],
      diagnostics: scraperDiagnostics,
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
