'use client';

import { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, Loader2, X, AlertCircle } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function ResumeTipsPage() {
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');

  const analyzeResume = async () => {
    if ((activeTab === 'text' && !resumeText.trim()) || (activeTab === 'upload' && !file)) {
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      let textToAnalyze = resumeText;
      
      // If file is uploaded, extract text (simplified - in production you'd use a proper PDF parser)
      if (activeTab === 'upload' && file) {
        if (file.type === 'text/plain') {
          textToAnalyze = await file.text();
        } else {
          // For PDF/DOCX files, we'll use the filename as a placeholder
          // In production, you'd integrate with a file parsing service
          textToAnalyze = `Resume file: ${file.name}\n\nPlease note: File parsing is not implemented in this demo. Please use the 'Paste Text' option for full functionality.`;
        }
      }
      
      const response = await fetch('/api/afrigter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'resume-tips',
          resumeText: textToAnalyze,
          experienceLevel,
          targetRole: targetRole || undefined,
          industry: industry || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze resume');
      }
      
      setAnalysisResult(data.response);
      setAnalysisComplete(true);
    } catch (err) {
      console.error('Resume analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing your resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Resume Tips & Feedback"
          description="Get AI-powered resume analysis and personalized feedback"
        />
        
        <div className="mt-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            {!analysisComplete ? (
              <div className="p-6">
                {/* Tab Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Analyze Your Resume</h2>
                  <div className="inline-flex rounded-lg border border-slate-700 p-1 bg-slate-800/50">
                    <button
                      onClick={() => setActiveTab('text')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'text' 
                          ? 'bg-slate-700 text-white' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <FileText className="inline w-4 h-4 mr-2 -mt-1" />
                      Paste Text
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'upload' 
                          ? 'bg-slate-700 text-white' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Upload className="inline w-4 h-4 mr-2 -mt-0.5" />
                      Upload File
                    </button>
                  </div>
                </div>
                
                {activeTab === 'text' ? (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Paste your resume content
                      </label>
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="w-full h-64 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Paste your resume content here..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">Upload your resume</h3>
                    <p className="text-slate-400 text-sm mb-4">Supported formats: PDF, DOCX, TXT (Max 5MB)</p>
                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileChange}
                      />
                      <span>Choose File</span>
                    </label>
                    {file && (
                      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 inline-flex items-center">
                        <FileText className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-sm text-slate-300">{file.name}</span>
                        <button 
                          onClick={() => setFile(null)}
                          className="ml-3 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value as any)}
                      className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-7 years)</option>
                      <option value="senior">Senior Level (8-15 years)</option>
                      <option value="executive">Executive (15+ years)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Target Role (Optional)
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Industry (Optional)
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Technology"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-medium mb-1">Analysis Failed</h4>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={analyzeResume}
                  disabled={isAnalyzing || (activeTab === 'text' ? !resumeText.trim() : !file)}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze My Resume
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Resume Analysis Results</h2>
                    <p className="text-slate-400 text-sm mt-1">AI-powered feedback from GPT-4o-mini</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Analysis Results */}
                <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50 mb-6">
                  <MarkdownRenderer content={analysisResult} />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setAnalysisComplete(false);
                      setAnalysisResult('');
                      setError('');
                    }}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Analyze Another Resume
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(analysisResult);
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Copy Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
