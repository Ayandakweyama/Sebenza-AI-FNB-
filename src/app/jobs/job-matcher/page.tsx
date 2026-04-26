'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  File,
  Search, 
  MapPin, 
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  Briefcase,
  GraduationCap,
  Target,
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MatchedJob {
  id?: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  postedDate: string;
  description: string;
  jobType?: string;
  industry?: string;
  reference?: string;
  url: string;
  source: string;
  matchScore: number;
  feedbackLikelihood: number;
  matchReason: string;
  missingSkills?: Array<{
    name: string;
    description: string;
    category: string;
    importance: string;
    reason: string;
  }>;
  matchingSkills?: Array<{
    name: string;
    description: string;
    category: string;
    context: string;
  }>;
}

interface CandidateProfile {
  skills: string[];
  experienceCount: number;
  educationCount: number;
  yearsOfExperience?: string;
}

export default function JobMatcherPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'search' | 'results'>('upload');
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('South Africa');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState('');
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [scraperInfo, setScraperInfo] = useState<{ totalScraped: number; sourcesUsed: string[] } | null>(null);

  const toggleSkillExpansion = (skillName: string) => {
    setExpandedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillName)) {
        newSet.delete(skillName);
      } else {
        newSet.add(skillName);
      }
      return newSet;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvFile(file);
    setError('');
    setIsProcessingFile(true);

    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setCvText(result.value);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Use pdfjs-dist for proper binary PDF text extraction
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
          pages.push(pageText);
        }
        setCvText(pages.join('\n'));
      } else {
        // Plain text files
        const text = await file.text();
        setCvText(text);
      }
    } catch (err) {
      setError('Failed to read file. Try pasting your CV text directly below.');
      console.error('Error reading file:', err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleCVSubmit = () => {
    if (!cvText.trim()) {
      setError('Please provide your CV text');
      return;
    }
    setStep('search');
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a job search query');
      return;
    }

    setIsLoading(true);
    setError('');

    // Cycle through descriptive loading messages
    const loadingSteps = [
      'Searching CareerJunction & job boards...',
      'Browsing live SA job listings...',
      'Analysing your CV skills...',
      'Matching jobs to your profile...',
      'Ranking by relevance...',
      'Almost done — finalising matches...',
    ];
    let stepIdx = 0;
    setLoadingMessage(loadingSteps[0]);
    const msgInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % loadingSteps.length;
      setLoadingMessage(loadingSteps[stepIdx]);
    }, 10000);

    try {
      const response = await fetch('/api/job-matcher/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText,
          query,
          location,
          yearsOfExperience,
          maxResults: 20,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to match jobs');
      }

      const data = await response.json();
      
      // Normalize scores to valid range (no artificial floor — API already filters at 30%)
      const validatedJobs = (data.matchedJobs || []).map((job: MatchedJob) => ({
        ...job,
        matchScore: Math.max(0, Math.min(100, job.matchScore || 0)),
        feedbackLikelihood: Math.max(0, Math.min(95, job.feedbackLikelihood || 0)),
      }));
      
      setMatchedJobs(validatedJobs);
      setCandidateProfile(data.candidateProfile || null);
      setScraperInfo({ totalScraped: data.totalScraped || 0, sourcesUsed: data.sourcesUsed || [] });
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      clearInterval(msgInterval);
      setIsLoading(false);
    }
  };

  const formatSourceLabel = (src: string) => {
    const labels: Record<string, string> = {
      careerjunction: 'CareerJunction',
      careers24: 'Careers24',
      jobmail: 'JobMail',
      indeed: 'Indeed',
      pnet: 'PNet',
      linkedin: 'LinkedIn',
      adzuna: 'Adzuna',
      'jobs-co-za': 'Jobs.co.za',
    };
    return labels[src] || src;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 55) return 'text-yellow-400';
    if (score >= 35) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-500/20 border-green-500/40';
    if (score >= 55) return 'bg-yellow-500/20 border-yellow-500/40';
    if (score >= 35) return 'bg-orange-500/20 border-orange-500/40';
    return 'bg-red-500/20 border-red-500/40';
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.button
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back
          </motion.button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            AI Job Matcher
          </h1>
          <p className="text-gray-400">
            Upload your CV and let AI find jobs where you're most likely to hear back
          </p>
        </div>

        {/* Step 1: CV Upload */}
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <File className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upload Your CV</h2>
                  <p className="text-sm text-gray-400">Paste your CV text or upload a file</p>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-slate-700/50 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">TXT, DOCX, PDF (text extraction)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                  />
                </label>
                {cvFile && (
                  <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                    {isProcessingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing {cvFile.name}...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {cvFile.name}
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Text Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Or paste your CV text
                </label>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your CV content here..."
                  className="w-full h-48 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}

              <button
                onClick={handleCVSubmit}
                disabled={!cvText.trim() || isProcessingFile}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Search Parameters */}
        {step === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Search className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Search Parameters</h2>
                  <p className="text-sm text-gray-400">What kind of jobs are you looking for?</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Title or Keywords
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Software Developer, Data Analyst"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., South Africa, Johannesburg"
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 pl-12 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Years of Experience
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 pl-12 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                    >
                      <option value="">Select experience level</option>
                      <option value="0-1">0-1 years (Entry level)</option>
                      <option value="1-3">1-3 years (Junior)</option>
                      <option value="3-5">3-5 years (Mid-level)</option>
                      <option value="5-10">5-10 years (Senior)</option>
                      <option value="10+">10+ years (Lead/Principal)</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="sm:flex-1 bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-600 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || isLoading}
                  className="sm:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="truncate">{loadingMessage || 'Matching...'}</span>
                    </>
                  ) : (
                    'Find Matches'
                  )}
                </button>
              </div>
            </div>

            {/* Candidate Profile Preview */}
            {candidateProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Your Profile
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </div>
                    <p className="text-2xl font-bold text-white">{candidateProfile.experienceCount}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </div>
                    <p className="text-2xl font-bold text-white">{candidateProfile.educationCount}</p>
                  </div>
                  {candidateProfile.yearsOfExperience && candidateProfile.yearsOfExperience !== 'Not specified' && (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <Target className="w-4 h-4" />
                        Years
                      </div>
                      <p className="text-2xl font-bold text-white">{candidateProfile.yearsOfExperience}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Detected Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {candidateProfile.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidateProfile.skills.length > 10 && (
                      <span className="text-gray-500 text-xs">
                        +{candidateProfile.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                onClick={() => setStep('search')}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Search
              </button>
              <div className="text-right">
                <p className="text-white font-medium">
                  {matchedJobs.length} matched job{matchedJobs.length !== 1 ? 's' : ''}
                </p>
                {scraperInfo && scraperInfo.totalScraped > 0 && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    from {scraperInfo.totalScraped} scraped &middot;{' '}
                    {scraperInfo.sourcesUsed.map(formatSourceLabel).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {matchedJobs.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                      <p className="text-gray-400 mb-2">{job.company}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{formatSourceLabel(job.source)}</span>
                        </span>
                        {job.salary && job.salary !== 'Not specified' && <span>{job.salary}</span>}
                        {job.postedDate && job.postedDate !== 'Recently' && (
                          <span className="text-gray-600">· {job.postedDate}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className={`px-4 py-2 rounded-lg border ${getScoreBgColor(job.matchScore)}`}>
                        <p className="text-xs text-gray-400 mb-1">Match Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(job.matchScore)}`}>
                          {job.matchScore}%
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border ${getScoreBgColor(job.feedbackLikelihood)}`}>
                        <p className="text-xs text-gray-400 mb-1">Hear Back</p>
                        <p className={`text-2xl font-bold ${getScoreColor(job.feedbackLikelihood)}`}>
                          {job.feedbackLikelihood}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-2 italic">{job.matchReason}</p>
                  {job.description && (
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2">{job.description}</p>
                  )}

                  {/* Skills Analysis */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {job.matchingSkills && job.matchingSkills.length > 0 && (
                      <div className="bg-green-500/10 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-3 flex items-center gap-1 font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Matching Skills ({job.matchingSkills.length})
                        </p>
                        <div className="space-y-3">
                          {job.matchingSkills.slice(0, 5).map((skill, i) => {
                            const skillName = typeof skill === 'string' ? skill : skill.name;
                            const isExpanded = expandedSkills.has(`${job.title}-match-${skillName}`);
                            
                            return (
                              <div key={i} className="text-xs border-b border-green-500/10 pb-2 last:border-0">
                                <div 
                                  className="flex items-center justify-between gap-2 cursor-pointer hover:bg-green-500/5 p-1 rounded transition-colors"
                                  onClick={() => toggleSkillExpansion(`${job.title}-match-${skillName}`)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded font-medium">
                                      {skillName}
                                    </span>
                                    <span className="text-green-400/70 text-[10px] uppercase tracking-wide">
                                      {typeof skill === 'string' ? '' : skill.category}
                                    </span>
                                  </div>
                                  <Info className="w-3 h-3 text-green-400/50 flex-shrink-0" />
                                </div>
                                {isExpanded && typeof skill !== 'string' && (
                                  <div className="mt-2 space-y-1 pl-1">
                                    {skill.description && (
                                      <p className="text-gray-300 text-[10px] leading-relaxed">
                                        <span className="text-green-400 font-medium">What it is:</span> {skill.description}
                                      </p>
                                    )}
                                    {skill.context && (
                                      <p className="text-green-400/80 text-[10px] leading-relaxed">
                                        <span className="text-green-400 font-medium">Why it matches:</span> {skill.context}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {job.missingSkills && job.missingSkills.length > 0 && (
                      <div className="bg-red-500/10 rounded-lg p-3">
                        <p className="text-xs text-red-400 mb-3 flex items-center gap-1 font-medium">
                          <XCircle className="w-3 h-3" />
                          Missing Skills ({job.missingSkills.length})
                        </p>
                        <div className="space-y-3">
                          {job.missingSkills.slice(0, 5).map((skill, i) => {
                            const skillName = typeof skill === 'string' ? skill : skill.name;
                            const isExpanded = expandedSkills.has(`${job.title}-missing-${skillName}`);
                            
                            return (
                              <div key={i} className="text-xs border-b border-red-500/10 pb-2 last:border-0">
                                <div 
                                  className="flex items-center justify-between gap-2 cursor-pointer hover:bg-red-500/5 p-1 rounded transition-colors"
                                  onClick={() => toggleSkillExpansion(`${job.title}-missing-${skillName}`)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-medium">
                                      {skillName}
                                    </span>
                                    <span className="text-red-400/70 text-[10px] uppercase tracking-wide">
                                      {typeof skill === 'string' ? '' : skill.category}
                                    </span>
                                  </div>
                                  <Info className="w-3 h-3 text-red-400/50 flex-shrink-0" />
                                </div>
                                {isExpanded && typeof skill !== 'string' && (
                                  <div className="mt-2 space-y-1 pl-1">
                                    {skill.description && (
                                      <p className="text-gray-300 text-[10px] leading-relaxed">
                                        <span className="text-red-400 font-medium">What it is:</span> {skill.description}
                                      </p>
                                    )}
                                    {skill.reason && (
                                      <p className="text-red-400/80 text-[10px] leading-relaxed">
                                        <span className="text-red-400 font-medium">Why you need it:</span> {skill.reason}
                                      </p>
                                    )}
                                    {skill.importance && (
                                      <p className="text-orange-400/80 text-[10px] leading-relaxed">
                                        <span className="text-orange-400 font-medium">Importance:</span> {skill.importance}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      View & Apply
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    {job.postedDate && (
                      <span className="text-gray-600 text-xs">{job.postedDate}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {matchedJobs.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Matching Jobs Found</h3>
                {scraperInfo && scraperInfo.totalScraped > 0 ? (
                  <p className="text-gray-400 mb-2">
                    Scraped <span className="text-white font-medium">{scraperInfo.totalScraped}</span> jobs from{' '}
                    {scraperInfo.sourcesUsed.map(formatSourceLabel).join(', ')} — none met the 30% relevance threshold for your CV.
                  </p>
                ) : (
                  <p className="text-gray-400 mb-2">
                    No jobs were retrieved from the job boards. The scrapers may be temporarily unavailable.
                  </p>
                )}
                <p className="text-gray-500 text-sm mb-6">
                  Try a broader query (e.g. &quot;developer&quot; instead of &quot;senior react developer&quot;) or paste more of your CV.
                </p>
                <button
                  onClick={() => setStep('search')}
                  className="bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-600 transition-all"
                >
                  Try Different Search
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
