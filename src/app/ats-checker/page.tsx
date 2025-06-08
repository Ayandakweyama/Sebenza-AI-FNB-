'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Star, 
  Target, 
  TrendingUp, 
  Download,
  Eye,
  RefreshCw,
  Zap,
  Award,
  BarChart3,
  Brain,
  Search,
  Clock,
  Shield,
  Lightbulb
} from 'lucide-react';

// Types
interface ATSScore {
  overall: number;
  formatting: number;
  keywords: number;
  sections: number;
  readability: number;
}

interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  density: { [key: string]: number };
}

interface SectionAnalysis {
  present: string[];
  missing: string[];
  recommendations: string[];
}

interface ATSResult {
  score: ATSScore;
  keywords: KeywordAnalysis;
  sections: SectionAnalysis;
  suggestions: string[];
  readabilityIssues: string[];
  formatIssues: string[];
}

// Components
const ScoreCard: React.FC<{ title: string; score: number; icon: React.ElementType; color: string }> = ({ 
  title, 
  score, 
  icon: Icon, 
  color 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-500/20 to-emerald-500/20';
    if (score >= 60) return 'from-yellow-500/20 to-orange-500/20';
    return 'from-red-500/20 to-pink-500/20';
  };

  return (
    <div className={`bg-gradient-to-br ${getScoreBackground(score)} backdrop-blur-sm border border-purple-400/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-r ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </div>
      </div>
      <h3 className="text-white font-semibold text-lg">{title}</h3>
      <div className="mt-3 bg-slate-700/50 rounded-full h-2">
        <div 
          className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const KeywordBadge: React.FC<{ keyword: string; matched: boolean; density?: number }> = ({ 
  keyword, 
  matched, 
  density 
}) => (
  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${
    matched 
      ? 'bg-green-500/20 border-green-400/30 text-green-300' 
      : 'bg-red-500/20 border-red-400/30 text-red-300'
  }`}>
    {matched ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
    <span>{keyword}</span>
    {density && <span className="text-xs opacity-75">({density}%)</span>}
  </div>
);

const SuggestionCard: React.FC<{ suggestion: string; type: 'error' | 'warning' | 'info' }> = ({ 
  suggestion, 
  type 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Lightbulb className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error': return 'border-red-400/30';
      case 'warning': return 'border-yellow-400/30';
      default: return 'border-blue-400/30';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 bg-slate-700/30 border ${getBorderColor()} rounded-lg`}>
      {getIcon()}
      <p className="text-gray-300 text-sm leading-relaxed">{suggestion}</p>
    </div>
  );
};

const FileUpload: React.FC<{ 
  onFileUpload: (file: File) => void; 
  isProcessing: boolean;
  fileName?: string;
}> = ({ onFileUpload, isProcessing, fileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
        dragActive
          ? 'border-purple-400 bg-purple-500/10'
          : 'border-purple-400/30 hover:border-purple-400/50'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        {isProcessing ? (
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin" />
        ) : (
          <Upload className="w-12 h-12 text-purple-400" />
        )}
        
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {isProcessing ? 'Analyzing Resume...' : 'Upload Your Resume'}
          </h3>
          <p className="text-gray-400 mb-4">
            {fileName ? `Selected: ${fileName}` : 'Drag and drop your resume or click to browse'}
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, DOC, DOCX formats • Max 10MB
          </p>
        </div>

        {!isProcessing && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-purple-500 to-yellow-400 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-400 hover:to-yellow-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Choose File
          </button>
        )}
      </div>
    </div>
  );
};

const ResultsSection: React.FC<{ results: ATSResult }> = ({ results }) => {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-yellow-400 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            ATS Compatibility Score
          </h2>
          <div className="text-right">
            <div className="text-4xl font-bold text-purple-400">{results.score.overall}%</div>
            <div className="text-sm text-gray-400">Overall Rating</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCard
            title="Formatting"
            score={results.score.formatting}
            icon={FileText}
            color="from-blue-500 to-cyan-400"
          />
          <ScoreCard
            title="Keywords"
            score={results.score.keywords}
            icon={Search}
            color="from-green-500 to-emerald-400"
          />
          <ScoreCard
            title="Sections"
            score={results.score.sections}
            icon={BarChart3}
            color="from-yellow-500 to-orange-400"
          />
          <ScoreCard
            title="Readability"
            score={results.score.readability}
            icon={Eye}
            color="from-pink-500 to-rose-400"
          />
        </div>
      </div>

      {/* Keywords Analysis */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg">
            <Search className="w-5 h-5 text-white" />
          </div>
          Keyword Analysis
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-green-300 font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Matched Keywords ({results.keywords.matched.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {results.keywords.matched.map((keyword, index) => (
                <KeywordBadge 
                  key={index} 
                  keyword={keyword} 
                  matched={true}
                  density={results.keywords.density[keyword]}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-red-300 font-medium mb-2 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Missing Keywords ({results.keywords.missing.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {results.keywords.missing.map((keyword, index) => (
                <KeywordBadge key={index} keyword={keyword} matched={false} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sections Analysis */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          Resume Structure
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-green-300 font-medium mb-3">Present Sections</h4>
            <div className="space-y-2">
              {results.sections.present.map((section, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  {section}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-red-300 font-medium mb-3">Missing Sections</h4>
            <div className="space-y-2">
              {results.sections.missing.map((section, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-300">
                  <XCircle className="w-4 h-4 text-red-400" />
                  {section}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-400 rounded-lg">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          Recommendations
        </h3>

        <div className="space-y-3">
          {results.suggestions.map((suggestion, index) => (
            <SuggestionCard key={index} suggestion={suggestion} type="info" />
          ))}
          {results.formatIssues.map((issue, index) => (
            <SuggestionCard key={`format-${index}`} suggestion={issue} type="error" />
          ))}
          {results.readabilityIssues.map((issue, index) => (
            <SuggestionCard key={`readability-${index}`} suggestion={issue} type="warning" />
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Component
const ATSChecker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ATSResult | null>(null);

  // Mock ATS analysis function
  const analyzeResume = async (file: File): Promise<ATSResult> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock analysis results
    return {
      score: {
        overall: 78,
        formatting: 85,
        keywords: 72,
        sections: 80,
        readability: 75
      },
      keywords: {
        matched: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Project Management'],
        missing: ['TypeScript', 'Docker', 'AWS', 'Machine Learning', 'Agile'],
        density: {
          'JavaScript': 2.3,
          'React': 1.8,
          'Node.js': 1.2,
          'Python': 2.1,
          'SQL': 0.9,
          'Project Management': 1.5
        }
      },
      sections: {
        present: ['Contact Information', 'Professional Summary', 'Work Experience', 'Education', 'Skills'],
        missing: ['Projects', 'Certifications', 'Achievements'],
        recommendations: [
          'Add a Projects section to showcase your work',
          'Include relevant certifications',
          'Quantify your achievements with metrics'
        ]
      },
      suggestions: [
        'Use action verbs to start bullet points (e.g., "Developed", "Implemented", "Led")',
        'Include more quantified achievements (percentages, numbers, dollar amounts)',
        'Add relevant industry keywords naturally throughout your resume',
        'Consider adding a Skills section with technical competencies',
        'Ensure consistent formatting throughout the document'
      ],
      readabilityIssues: [
        'Some sentences are too long and complex',
        'Use more active voice instead of passive voice',
        'Break up large paragraphs into smaller, digestible points'
      ],
      formatIssues: [
        'Inconsistent bullet point formatting',
        'Mixed font sizes detected',
        'Consider using a more ATS-friendly font like Arial or Calibri'
      ]
    };
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsProcessing(true);
    setResults(null);

    try {
      const analysisResults = await analyzeResume(uploadedFile);
      setResults(analysisResults);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReanalyze = () => {
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 px-6 pb-6 pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
              ATS Resume Checker
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Optimize your resume for Applicant Tracking Systems and increase your chances of getting hired
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-lg p-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300 text-sm">Instant Analysis</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-lg p-4">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-gray-300 text-sm">100% Secure</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-lg p-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300 text-sm">AI-Powered</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-slate-800/50 rounded-lg p-4">
                <Award className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 text-sm">Expert Tips</span>
              </div>
            </div>
          </div>

          {!file && !isProcessing && (
            <div className="max-w-2xl mx-auto mb-8">
              <FileUpload 
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
                fileName={file?.name}
              />
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-slate-800/50 rounded-lg px-6 py-4">
                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                <span className="text-white font-medium">Analyzing your resume...</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleReanalyze}
                  className="bg-gradient-to-r from-purple-500 to-yellow-400 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-400 hover:to-yellow-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-analyze
                </button>
                <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button 
                  onClick={() => setFile(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload New Resume
                </button>
              </div>

              <ResultsSection results={results} />
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12 text-gray-400">
            <p>Your resume is analyzed locally and never stored on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;