'use client';

import { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, Loader2, X } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default function ResumeTipsPage() {
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('text');
  const [file, setFile] = useState<File | null>(null);

  const analyzeResume = () => {
    if ((activeTab === 'text' && !resumeText.trim()) || (activeTab === 'upload' && !file)) {
      return;
    }
    
    setIsAnalyzing(true);
    
    // Simulate API call
    setTimeout(() => {
      setAnalysisComplete(true);
      setIsAnalyzing(false);
    }, 2000);
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
                    <h2 className="text-xl font-semibold text-white">Resume Analysis</h2>
                    <p className="text-slate-400 text-sm mt-1">Based on our AI analysis</p>
                  </div>
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                        <span className="text-2xl font-bold text-white">78</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-slate-400">Overall Score</p>
                      <p className="text-white font-medium">Good</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                    <h3 className="font-medium text-white mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      What's Working Well
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                        </div>
                        <span className="ml-2 text-sm text-slate-300">Clear work experience section</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                        </div>
                        <span className="ml-2 text-sm text-slate-300">Good use of action verbs</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                    <h3 className="font-medium text-white mb-3 flex items-center">
                      <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                        </div>
                        <span className="ml-2 text-sm text-slate-300">Add more measurable achievements</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                        </div>
                        <span className="ml-2 text-sm text-slate-300">Include more relevant skills</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <button
                  onClick={() => setAnalysisComplete(false)}
                  className="mt-6 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze Another Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
