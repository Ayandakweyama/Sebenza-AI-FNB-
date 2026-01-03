'use client';

import { useState } from 'react';
import { Loader2, MessageCircle, Play, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function InterviewPrepPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prepResult, setPrepResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  
  const generateInterviewPrep = async () => {
    if (!role.trim()) {
      setError('Please enter a role to prepare for');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/afrigter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'interview-prep',
          role,
          experienceLevel,
          company: company || undefined,
          industry: industry || undefined,
          interviewType: selectedType || 'general',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate interview preparation');
      }
      
      setPrepResult(data.response);
      setShowResult(true);
    } catch (err) {
      console.error('Interview prep error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating interview preparation');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const resetForm = () => {
    setShowResult(false);
    setPrepResult('');
    setError('');
    setSelectedType(null);
    setRole('');
    setCompany('');
    setIndustry('');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-8">
            <a 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-5 w-5 mr-2" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              Back to Dashboard
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent text-center">
              Interview Preparation
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base text-center px-2">
            Prepare for your next job interview with AI-powered practice sessions
          </p>
        </div>
        
        <div className="mt-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            {!showResult ? (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Interview Preparation</h2>
                  <p className="text-slate-300">Get AI-powered interview preparation tailored to your target role and experience level.</p>
                </div>
        
                {/* Interview Type Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Interview Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button 
                      onClick={() => setSelectedType('technical')}
                      className={`p-4 rounded-lg text-left transition-all ${selectedType === 'technical' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}
                    >
                      <h4 className="font-medium">Technical</h4>
                      <p className="text-xs mt-1 opacity-80">Coding & technical skills</p>
                    </button>
                    <button 
                      onClick={() => setSelectedType('behavioral')}
                      className={`p-4 rounded-lg text-left transition-all ${selectedType === 'behavioral' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}
                    >
                      <h4 className="font-medium">Behavioral</h4>
                      <p className="text-xs mt-1 opacity-80">Situational questions</p>
                    </button>
                    <button 
                      onClick={() => setSelectedType('case-study')}
                      className={`p-4 rounded-lg text-left transition-all ${selectedType === 'case-study' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}
                    >
                      <h4 className="font-medium">Case Study</h4>
                      <p className="text-xs mt-1 opacity-80">Problem solving</p>
                    </button>
                    <button 
                      onClick={() => setSelectedType('general')}
                      className={`p-4 rounded-lg text-left transition-all ${selectedType === 'general' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}
                    >
                      <h4 className="font-medium">General</h4>
                      <p className="text-xs mt-1 opacity-80">Mixed questions</p>
                    </button>
                  </div>
                </div>
                
                {/* Job Details Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Target Role *
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Software Engineer, Product Manager"
                      required
                    />
                  </div>
                  
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
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Google, Microsoft"
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
                      placeholder="e.g., Technology, Finance"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-medium mb-1">Preparation Failed</h4>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={generateInterviewPrep}
                  disabled={isGenerating || !role.trim()}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Generating Preparation...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Interview Prep
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Interview Preparation Guide</h2>
                    <p className="text-slate-400 text-sm mt-1">AI-powered preparation from GPT-4o-mini</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Preparation Results */}
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm mb-6 shadow-2xl shadow-slate-900/50">
                  <div className="max-w-none">
                    <MarkdownRenderer content={prepResult} />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Prepare for Another Interview
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prepResult);
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Preparation Guide
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
