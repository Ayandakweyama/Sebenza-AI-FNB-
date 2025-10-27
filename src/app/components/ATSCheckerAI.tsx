'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  Zap,
  BarChart3,
  Download,
  RefreshCw,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateAtsReport, generateWordReport } from '@/lib/generateAtsReport';
import { toast } from 'sonner';

interface ATSAnalysis {
  overallScore: number;
  breakdown: {
    formatting: number;
    keywords: number;
    sections: number;
    readability: number;
    achievements: number;
    skills: number;
    experience: number;
  };
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    criticalIssues: string[];
  };
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    density: number;
    relevanceScore: number;
  };
  sectionAnalysis: any;
  atsCompatibility: {
    parseability: number;
    formatIssues: string[];
    recommendations: string[];
  };
  industryInsights: {
    industryStandards: string[];
    competitorComparison: string;
    marketTrends: string[];
  };
  aiRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  keywordSuggestions?: any;
  improvementPlan?: any;
  benchmarkComparison?: any;
}

export function ATSCheckerAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'improvements' | 'insights'>('overview');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setResumeText(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  }, []);

  const analyzeResume = async () => {
    if (!resumeText) {
      toast.error('Please upload a resume or paste text');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ats/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          industry,
          experienceLevel
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      toast.success('AI analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const downloadReport = () => {
    if (!analysis) return;

    const reportData = {
      score: analysis.overallScore,
      matchedKeywords: analysis.keywordAnalysis.matched,
      missingKeywords: analysis.keywordAnalysis.missing,
      jobTitle: industry,
      jobCompany: '',
      analysisDate: new Date().toLocaleDateString(),
      recommendations: [
        ...analysis.aiRecommendations.immediate,
        ...analysis.detailedAnalysis.improvements
      ],
      strengths: analysis.detailedAnalysis.strengths,
      improvements: analysis.detailedAnalysis.weaknesses,
      breakdown: analysis.breakdown,
      atsCompatibility: {
        score: analysis.atsCompatibility.parseability,
        issues: analysis.atsCompatibility.formatIssues
      }
    };

    generateAtsReport(reportData);
  };

  const downloadWordReport = async () => {
    if (!analysis) return;

    const reportData = {
      score: analysis.overallScore,
      matchedKeywords: analysis.keywordAnalysis.matched,
      missingKeywords: analysis.keywordAnalysis.missing,
      jobTitle: industry,
      jobCompany: '',
      analysisDate: new Date().toLocaleDateString(),
      recommendations: [
        ...analysis.aiRecommendations.immediate,
        ...analysis.detailedAnalysis.improvements
      ],
      strengths: analysis.detailedAnalysis.strengths,
      improvements: analysis.detailedAnalysis.weaknesses,
      breakdown: analysis.breakdown,
      atsCompatibility: {
        score: analysis.atsCompatibility.parseability,
        issues: analysis.atsCompatibility.formatIssues
      }
    };

    try {
      await generateWordReport(reportData);
      toast.success('Word report downloaded!');
    } catch (error) {
      toast.error('Failed to generate Word report');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <Brain className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-Powered ATS Resume Checker
            </h1>
          </motion.div>
          <p className="text-slate-300 text-lg">
            Get detailed AI analysis and personalized recommendations to optimize your resume
          </p>
        </div>

        {/* Input Section */}
        {!analysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 mb-8"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {/* Resume Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Resume Text
                </label>
                <div className="relative">
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here..."
                    className="w-full h-64 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <label className="absolute bottom-4 right-4">
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-500/30 hover:border-purple-500"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                  </label>
                </div>
              </div>

              {/* Job Description Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Job Description (Optional)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description for better keyword matching..."
                  className="w-full h-64 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Technology, Finance, Healthcare"
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={analyzeResume}
                disabled={isAnalyzing || !resumeText}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze Resume with AI
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Score Overview */}
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-white mb-2">ATS Compatibility Score</h2>
                    <p className="text-slate-400">
                      AI-powered analysis of your resume's ATS performance
                    </p>
                  </div>
                  
                  {/* Main Score */}
                  <div className="relative">
                    <div className="w-32 h-32 relative">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-slate-700"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.overallScore / 100)}`}
                          className={`${getScoreColor(analysis.overallScore)} transition-all duration-1000`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                          {analysis.overallScore}%
                        </span>
                        <span className="text-xs text-slate-400">AI Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setAnalysis(null)}
                      variant="outline"
                      className="border-slate-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Analysis
                    </Button>
                    <Button
                      onClick={downloadReport}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-8">
                  {Object.entries(analysis.breakdown).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-white">{value}%</div>
                      <div className="text-xs text-slate-400 capitalize">{key}</div>
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getScoreGradient(value as number)} transition-all duration-500`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {['overview', 'keywords', 'improvements', 'insights'].map((tab) => (
                  <Button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    variant={activeTab === tab ? 'default' : 'outline'}
                    className={activeTab === tab 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'border-slate-700 hover:border-purple-500'}
                  >
                    {tab === 'overview' && <BarChart3 className="w-4 h-4 mr-2" />}
                    {tab === 'keywords' && <Target className="w-4 h-4 mr-2" />}
                    {tab === 'improvements' && <TrendingUp className="w-4 h-4 mr-2" />}
                    {tab === 'insights' && <Brain className="w-4 h-4 mr-2" />}
                    <span className="capitalize">{tab}</span>
                  </Button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Strengths */}
                    {analysis.detailedAnalysis.strengths.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Strengths
                        </h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {analysis.detailedAnalysis.strengths.map((strength, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-300">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Critical Issues */}
                    {analysis.detailedAnalysis.criticalIssues.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          Critical Issues
                        </h3>
                        <div className="space-y-2">
                          {analysis.detailedAnalysis.criticalIssues.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-300">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ATS Compatibility */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        ATS Compatibility
                      </h3>
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-slate-300">Parseability Score</span>
                          <span className="text-xl font-bold text-purple-400">
                            {analysis.atsCompatibility.parseability}%
                          </span>
                        </div>
                        {analysis.atsCompatibility.formatIssues.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-slate-700">
                            {analysis.atsCompatibility.formatIssues.map((issue, idx) => (
                              <div key={idx} className="text-sm text-slate-400">
                                • {issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Keywords Tab */}
                {activeTab === 'keywords' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Matched Keywords */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Matched Keywords ({analysis.keywordAnalysis.matched.length})
                        </h3>
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                          {analysis.keywordAnalysis.matched.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Keywords */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          Missing Keywords ({analysis.keywordAnalysis.missing.length})
                        </h3>
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                          {analysis.keywordAnalysis.missing.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm text-red-400"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Keyword Metrics */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Keyword Density</span>
                          <span className="text-lg font-bold text-purple-400">
                            {analysis.keywordAnalysis.density.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Relevance Score</span>
                          <span className="text-lg font-bold text-purple-400">
                            {analysis.keywordAnalysis.relevanceScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Improvements Tab */}
                {activeTab === 'improvements' && (
                  <div className="space-y-6">
                    {/* Immediate Actions */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-red-500" />
                        Immediate Actions
                      </h3>
                      <div className="space-y-2">
                        {analysis.aiRecommendations.immediate.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <span className="text-red-500 font-bold">{idx + 1}.</span>
                            <span className="text-sm text-slate-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Short Term */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                        Short Term (1-2 weeks)
                      </h3>
                      <div className="space-y-2">
                        {analysis.aiRecommendations.shortTerm.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <span className="text-yellow-500 font-bold">{idx + 1}.</span>
                            <span className="text-sm text-slate-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Long Term */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        Long Term Strategy
                      </h3>
                      <div className="space-y-2">
                        {analysis.aiRecommendations.longTerm.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <span className="text-blue-500 font-bold">{idx + 1}.</span>
                            <span className="text-sm text-slate-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <div className="space-y-6">
                    {/* Industry Standards */}
                    {analysis.industryInsights.industryStandards.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-purple-500" />
                          Industry Standards
                        </h3>
                        <div className="space-y-2">
                          {analysis.industryInsights.industryStandards.map((standard, idx) => (
                            <div key={idx} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <span className="text-sm text-slate-300">{standard}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competitor Comparison */}
                    {analysis.industryInsights.competitorComparison && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-500" />
                          Competitor Comparison
                        </h3>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-slate-300">
                            {analysis.industryInsights.competitorComparison}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Market Trends */}
                    {analysis.industryInsights.marketTrends.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          Market Trends
                        </h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {analysis.industryInsights.marketTrends.map((trend, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-300">{trend}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
