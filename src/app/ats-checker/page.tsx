'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download, Zap, Target, Award, TrendingUp, Link } from 'lucide-react';
import { generateAtsReport, generateWordReport } from '@/lib/generateAtsReport';
// Define types for our analysis results
interface KeywordAnalysis {
  found: string[];
  missing: string[];
}

interface AnalysisResult {
  score: number;
  keywordAnalysis: KeywordAnalysis;
  skills: string[];
  experience: any[];
  education: any[];
  overallScore?: number;
  breakdown?: any;
  strengths?: string[];
  improvements?: string[];
  atsCompatibility?: {
    score: number;
    issues: string[];
  };
}

interface JobAnalysisResult {
  keywords: string[];
  skills: string[];
  title: string;
  description: string;
  jobTitle?: string;
  company?: string;
  summary?: string;
  qualifications?: string[];
}

import { analyzeCVWithAI, extractTextFromFile } from '@/lib/cvAnalyzer';

// Generate keywords for ATS analysis
const generateKeywordsForATS = (text: string): string[] => {
  if (!text) return [];
  // Basic keyword extraction - can be enhanced as needed
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3) // Filter out short words
    .map(word => word.replace(/[^a-z0-9]/g, '')) // Remove non-alphanumeric chars
    .filter(Boolean); // Remove empty strings
};

const ATSAnalyzer = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [jobQualifications, setJobQualifications] = useState<string>('');
  const [qualificationKeywords, setQualificationKeywords] = useState<string[]>([]);
  // const [isAnalyzingJobPost, setIsAnalyzingJobPost] = useState<boolean>(false); // No longer needed - automatic extraction
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysisResult | null>(null);
  


  // Function to analyze CV using AI-powered analysis
  const analyzeCV = async (file: File) => {
    try {
      // Extract text from the uploaded file
      const cvText = await extractTextFromFile(file);
      
      // Get job keywords for comparison
      const jobKeywords = jobAnalysis ? 
        [...(jobAnalysis.keywords || []), ...(jobAnalysis.skills || [])] : 
        qualificationKeywords || [];
      
      console.log('Starting AI-powered ATS analysis...');
      
      // Use AI-powered analysis with GLM
      const aiAnalysis = await analyzeCVWithAI(cvText, 'glm', jobKeywords);
      
      console.log('AI analysis completed:', aiAnalysis);
      
      // Transform AI response to our expected format
      const result = {
        score: aiAnalysis.overallScore || aiAnalysis.score || 0,
        overallScore: aiAnalysis.overallScore || aiAnalysis.score || 0,
        breakdown: aiAnalysis.breakdown || {},
        strengths: aiAnalysis.strengths || [],
        improvements: aiAnalysis.improvements || [],
        keywordAnalysis: {
          found: aiAnalysis.keywordAnalysis?.foundKeywords || aiAnalysis.keywordAnalysis?.found || [],
          missing: aiAnalysis.keywordAnalysis?.missingKeywords || aiAnalysis.keywordAnalysis?.missing || []
        },
        atsCompatibility: aiAnalysis.atsCompatibility || { score: 0, issues: [] },
        skills: aiAnalysis.keywordAnalysis?.foundKeywords || [],
        experience: [],
        education: []
      };

      console.log('Transformed analysis result:', result);
      return result;
      
    } catch (error) {
      console.error('Error in AI-powered CV analysis:', error);
      
      // Fallback to basic keyword analysis if AI fails
      console.log('Falling back to basic keyword analysis...');
      const cvText = await extractTextFromFile(file);
      const cvKeywords = extractKeywords(cvText);
      
      const jobKeywords = jobAnalysis ? 
        [...(jobAnalysis.keywords || []), ...(jobAnalysis.skills || [])] : 
        qualificationKeywords || [];
      
      const matchedKeywords = cvKeywords.filter(keyword => 
        jobKeywords.some(jobKeyword => 
          jobKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(jobKeyword.toLowerCase())
        )
      );
      
      const score = jobKeywords.length > 0 
        ? Math.min(100, Math.round((matchedKeywords.length / jobKeywords.length) * 100))
        : 0;
      
      return {
        score,
        keywordAnalysis: {
          found: Array.from(new Set(matchedKeywords)),
          missing: Array.from(new Set(
            jobKeywords.filter(k => !matchedKeywords.some(mk => 
              k.toLowerCase().includes(mk.toLowerCase()) ||
              mk.toLowerCase().includes(k.toLowerCase())
            ))
          ))
        },
        skills: Array.from(new Set(cvKeywords)),
        experience: [],
        education: [],
        strengths: ['Basic keyword matching completed'],
        improvements: ['Consider using AI-powered analysis for detailed insights'],
        atsCompatibility: { score: score, issues: [] }
      };
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.type.includes('document')) {
        setUploadedFile(file);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        setUploadedFile(file);
      }
    }
  };

  // Extract keywords from text
  const extractKeywords = (text: string): string[] => {
    if (!text.trim()) return [];
    
    // Remove special characters and convert to lowercase
    const cleanText = text
      .replace(/[^\w\s]/g, ' ') // Replace non-word characters with space
      .toLowerCase();
      
    // Split into words and filter out common stop words
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'about', 'as', 'from'
    ]);
    
    // Extract words with 3+ characters that aren't stop words
    return Array.from(new Set(
      cleanText
        .split(/\s+/)
        .filter(word => word.length >= 3 && !stopWords.has(word))
    ));
  };

  const handleQualificationsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJobQualifications(text);
    
    // Automatically extract keywords as user types/pastes
    if (text.trim()) {
      const keywords = extractKeywords(text);
      setQualificationKeywords(keywords);
      
      // Set a simple job analysis for keyword highlighting
      setJobAnalysis({
        keywords: keywords,
        skills: [],
        qualifications: [],
        title: 'Job Posting',
        company: 'Company',
        description: text
      });
    } else {
      setQualificationKeywords([]);
      setJobAnalysis(null);
    }
  };

  // No longer needed - automatic extraction on paste/type
  /* const handleAnalyzeJobPost = async () => {
    if (!jobQualifications.trim()) return;
    
    setIsAnalyzingJobPost(true);
    try {
      // Use AI-powered job post analysis
      const response = await fetch('/api/analyze-job-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobPostText: jobQualifications
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Create comprehensive analysis result
      const analysis = {
        keywords: data.analysis.keywords || [],
        skills: data.analysis.skills || [],
        qualifications: data.analysis.qualifications || [],
        title: data.analysis.jobTitle || 'Job Posting',
        company: data.analysis.company || 'Unknown Company',
        description: data.analysis.summary || jobQualifications
      };
      
      // Combine all keywords for ATS matching
      const allKeywords = [
        ...analysis.keywords,
        ...analysis.skills,
        ...analysis.qualifications
      ].filter((keyword, index, array) => 
        keyword && keyword.trim() && array.indexOf(keyword) === index
      );
      
      setJobAnalysis(analysis);
      setQualificationKeywords(allKeywords);
      
      // Show success message with analysis details
      const keywordCount = allKeywords.length;
      const skillCount = analysis.skills.length;
      const qualCount = analysis.qualifications.length;
      
      // Determine if this was AI analysis or fallback
      const isAiAnalysis = skillCount > 0 || qualCount > 0 || analysis.title !== 'Job Position';
      const analysisType = isAiAnalysis ? '🤖 AI Analysis' : '⚡ Basic Analysis';
      
      alert(`✅ Job post analyzed successfully!\n\n📊 ${analysisType} Results:\n• ${keywordCount} ATS keywords extracted\n• ${skillCount} technical skills identified\n• ${qualCount} qualifications found\n• Job Title: ${analysis.title}\n• Company: ${analysis.company}\n\nKeywords will now be highlighted in your resume analysis.`);
      
    } catch (error) {
      console.error('Failed to analyze job post:', error);
      
      // Fallback to basic keyword extraction
      console.log('Falling back to basic keyword extraction...');
      const fallbackKeywords = extractKeywords(jobQualifications);
      
      const fallbackAnalysis = {
        keywords: fallbackKeywords,
        skills: [],
        qualifications: [],
        title: 'Job Posting',
        company: 'Unknown Company',
        description: jobQualifications
      };
      
      setJobAnalysis(fallbackAnalysis);
      setQualificationKeywords(fallbackKeywords);
      
      alert(`⚠️ AI analysis failed, using basic keyword extraction instead.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nExtracted ${fallbackKeywords.length} basic keywords from the job post.`);
    } finally {
      // setIsAnalyzingJobPost(false);
    }
  }; */

  const highlightMatchingKeywords = (text: string) => {
    if (!qualificationKeywords.length) return text;
    
    const regex = new RegExp(`(${qualificationKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return text.split(regex).map((part, i) => 
      qualificationKeywords.some(k => k.toLowerCase() === part.toLowerCase()) 
        ? <span key={i} className="bg-yellow-500/30 text-yellow-300 px-1 rounded">{part}</span> 
        : part
    );
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeCV(uploadedFile);
      
      // If we have qualification keywords, update the analysis to highlight matches
      if (qualificationKeywords.length > 0) {
        // Create a copy of the result to avoid mutating the original
        const updatedResult = { ...result };
        
        // Update found keywords to include any from qualifications
        const foundKeywords = new Set([
          ...(updatedResult.keywordAnalysis?.found || []),
          ...qualificationKeywords
        ]);
        
        updatedResult.keywordAnalysis = {
          ...updatedResult.keywordAnalysis,
          found: Array.from(foundKeywords)
        };
        
        setAnalysisResult(updatedResult);
      } else {
        setAnalysisResult(result);
      }
    } catch (error) {
      console.error('Error analyzing CV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze CV. Please try again.';
      alert(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate enhanced PDF report
  const handleDownloadReport = () => {
    if (!analysisResult) return;

    const reportData = {
      score: analysisResult.score,
      matchedKeywords: analysisResult.keywordAnalysis?.found || [],
      missingKeywords: analysisResult.keywordAnalysis?.missing || [],
      jobTitle: jobAnalysis?.jobTitle || 'Job Position',
      jobCompany: jobAnalysis?.company || '',
      analysisDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      strengths: analysisResult.strengths || [],
      improvements: analysisResult.improvements || [],
      breakdown: analysisResult.breakdown || {},
      atsCompatibility: analysisResult.atsCompatibility || { score: analysisResult.score, issues: [] },
      recommendations: (analysisResult.improvements && analysisResult.improvements.length > 0) ? analysisResult.improvements : [
        'Review the missing keywords and consider adding relevant ones to your resume.',
        'Use action verbs to describe your experiences and achievements.',
        'Ensure your resume is well-structured with clear section headings.',
        'Include quantifiable achievements to demonstrate your impact.',
        'Keep your resume concise and focused on the most relevant experiences.',
        'Use standard fonts and formatting that ATS systems can easily parse.'
      ]
    };

    // Generate the enhanced report
    generateAtsReport(reportData);
  };

  // Generate Word document report
  const handleDownloadWordReport = async () => {
    if (!analysisResult) return;

    try {
      const reportData = {
        score: analysisResult.score,
        matchedKeywords: analysisResult.keywordAnalysis?.found || [],
        missingKeywords: analysisResult.keywordAnalysis?.missing || [],
        jobTitle: jobAnalysis?.jobTitle || 'Job Position',
        jobCompany: jobAnalysis?.company || '',
        analysisDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        strengths: analysisResult.strengths || [],
        improvements: analysisResult.improvements || [],
        breakdown: analysisResult.breakdown || {},
        atsCompatibility: analysisResult.atsCompatibility || { score: analysisResult.score, issues: [] },
        recommendations: (analysisResult.improvements && analysisResult.improvements.length > 0) ? analysisResult.improvements : [
          'Review the missing keywords and consider adding relevant ones to your resume.',
          'Use action verbs to describe your experiences and achievements.',
          'Ensure your resume is well-structured with clear section headings.',
          'Include quantifiable achievements to demonstrate your impact.',
          'Keep your resume concise and focused on the most relevant experiences.',
          'Use standard fonts and formatting that ATS systems can easily parse.'
        ]
      };

      await generateWordReport(reportData);
    } catch (error) {
      console.error('Error downloading Word report:', error);
      alert('Failed to download Word report. Please try again.');
    }
  };

  // Helper function to get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Helper function to get score label
  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
          <span className="bg-gradient-to-r from-pink-500 to-pink-600 text-transparent bg-clip-text">
            ATS Resume Checker
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 text-center max-w-3xl mx-auto">
          Upload your resume and job description to check your ATS compatibility score
        </p>

        {/* Upload Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-400" />
            Upload Your Resume
          </h2>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-purple-500 bg-slate-700' : 'border-slate-600'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 mx-auto mb-4 text-purple-400" />
            <p className="mb-2">Drag & drop your resume here, or click to browse</p>
            <p className="text-sm text-gray-400 mb-4">Supported formats: DOCX, DOC (Word documents only)</p>
            
            {/* Fun Fact about Word Documents */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left">
              <div className="flex items-start gap-2">
                <div className="text-xs text-blue-300">
                  <strong>💡 Fun Fact:</strong> Word documents (.doc/.docx) are optimal for ATS systems because they preserve formatting structure and metadata that helps ATS software parse sections, headers, and content hierarchy more accurately than PDFs or plain text.
                  <div className="mt-2 space-x-2">
                    <span className="text-blue-500">•</span>
                    <a href="https://www.indeed.com/career-advice/resumes-cover-letters/ats-resume" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline text-xs">Indeed ATS Tips</a>
                  </div>
                </div>
              </div>
            </div>
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".docx,.doc"
              onChange={handleFileChange}
            />
            <label
              htmlFor="resume-upload"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Select File
            </label>
          </div>
          
          {uploadedFile && (
            <div className="mt-4 p-3 bg-slate-700 rounded-lg flex items-center">
              <FileText className="w-5 h-5 text-green-400 mr-2" />
              <span className="flex-1 truncate">{uploadedFile.name}</span>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Job Description Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-400" />
            Job Description or Requirements
          </h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Description/Requirements (Optional) 
              <span className="text-purple-400 text-xs ml-2">✨ Automatic Keyword Extraction</span>
            </label>
            <div className="mb-4">
              <textarea
                value={jobQualifications}
                onChange={handleQualificationsChange}
                placeholder="Paste the job description or requirements here...

Keywords will be automatically extracted and highlighted in your resume analysis!"
                className="w-full h-40 p-3 bg-slate-700 border border-slate-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            {jobQualifications.trim() && qualificationKeywords.length > 0 && (
              <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-purple-400 mb-2">✅ {qualificationKeywords.length} keywords extracted</p>
                <div className="flex flex-wrap gap-1">
                  {qualificationKeywords.slice(0, 10).map((keyword, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
                      {keyword}
                    </span>
                  ))}
                  {qualificationKeywords.length > 10 && (
                    <span className="text-xs px-2 py-1 text-gray-400">
                      +{qualificationKeywords.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={!uploadedFile || isAnalyzing}
            className={`px-8 py-3 text-lg font-medium rounded-lg flex items-center transition-colors ${!uploadedFile || isAnalyzing ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'}`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Check ATS Compatibility'}
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-slate-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                ATS Analysis Results
              </span>
            </h2>
            
            {/* Score Summary */}
            <div className="bg-slate-750 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-400" />
                ATS Compatibility
              </h3>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className={`text-5xl font-bold mr-4 ${getScoreColor(analysisResult.score)}`}>
                    {analysisResult.score}%
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {getScoreLabel(analysisResult.score)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {analysisResult.score >= 70 ? 'Good match for this position' : 'Could be improved'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <div className="text-sm text-gray-300 mb-2">
                    Based on {analysisResult.keywordAnalysis?.found.length || 0} matched keywords
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getScoreColor(analysisResult.score).replace('text-', 'bg-')}`}
                      style={{ width: `${analysisResult.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {analysisResult.keywordAnalysis?.found.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300">Matched Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywordAnalysis.found.slice(0, 15).map((keyword: string, index: number) => (
                      <span key={index} className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                    {analysisResult.keywordAnalysis.found.length > 15 && (
                      <span className="text-gray-400 text-sm">+{analysisResult.keywordAnalysis.found.length - 15} more</span>
                    )}
                  </div>
                </div>
              )}
              
              {analysisResult.keywordAnalysis?.missing.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-sm font-semibold text-gray-300">Missing Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywordAnalysis.missing.slice(0, 15).map((keyword: string, index: number) => (
                      <span key={index} className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                    {analysisResult.keywordAnalysis.missing.length > 15 && (
                      <span className="text-gray-400 text-sm">+{analysisResult.keywordAnalysis.missing.length - 15} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Breakdown */}
            {analysisResult.breakdown && Object.keys(analysisResult.breakdown).length > 0 && (
              <div className="bg-slate-750 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                  Detailed Score Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.breakdown).map(([key, value]) => (
                    <div key={key} className="bg-slate-700 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-300 capitalize mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(Number(value))}`}>
                        {Number(value)}%
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full ${getScoreColor(Number(value)).replace('text-', 'bg-')}`}
                          style={{ width: `${Number(value)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                <div className="bg-slate-750 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-green-400">
                    <Award className="w-5 h-5 mr-2" />
                    Strengths
                  </h3>
                  <div className="space-y-3">
                    {analysisResult.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.improvements && analysisResult.improvements.length > 0 && (
                <div className="bg-slate-750 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-yellow-400">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-3">
                    {analysisResult.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ATS Compatibility Issues */}
            {analysisResult.atsCompatibility && analysisResult.atsCompatibility.issues && analysisResult.atsCompatibility.issues.length > 0 && (
              <div className="bg-slate-750 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-red-400">
                  <XCircle className="w-5 h-5 mr-2" />
                  ATS Compatibility Issues
                </h3>
                <div className="space-y-3">
                  {analysisResult.atsCompatibility.issues.map((issue, index) => (
                    <div key={index} className="flex items-start">
                      <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setAnalysisResult(null);
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Analyze Another CV
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                onClick={handleDownloadReport}
                disabled={!analysisResult}
                style={!analysisResult ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                onClick={handleDownloadWordReport}
                disabled={!analysisResult}
                style={!analysisResult ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <FileText className="w-4 h-4" />
                <span>Download Word Report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSAnalyzer;