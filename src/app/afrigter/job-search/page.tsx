'use client';

import { useState } from 'react';
import { Loader2, Search, MapPin, DollarSign, Briefcase, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function JobSearchPage() {
  const [role, setRole] = useState('');
  const [field, setField] = useState('');
  const [locations, setLocations] = useState<string[]>(['']);
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [salary, setSalary] = useState('');
  const [workType, setWorkType] = useState<'remote' | 'hybrid' | 'onsite' | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategyResult, setStrategyResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  const addLocation = () => {
    setLocations([...locations, '']);
  };

  const updateLocation = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const generateJobSearchStrategy = async () => {
    const validLocations = locations.filter(loc => loc.trim());
    
    if (!role.trim() || !field.trim() || validLocations.length === 0) {
      setError('Please fill in role, field, and at least one location');
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
          type: 'job-search',
          role,
          field,
          locations: validLocations,
          experienceLevel,
          salary: salary || undefined,
          workType: workType || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate job search strategy');
      }
      
      setStrategyResult(data.response);
      setShowResult(true);
    } catch (err) {
      console.error('Job search strategy error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating job search strategy');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const resetForm = () => {
    setShowResult(false);
    setStrategyResult('');
    setError('');
    setRole('');
    setField('');
    setLocations(['']);
    setSalary('');
    setWorkType('');
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
              Job Search Strategy
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base text-center px-2">
            Develop an effective job search strategy tailored to your goals
          </p>
        </div>
        
        <div className="mt-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            {!showResult ? (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Job Search Strategy</h2>
                  <p className="text-slate-300">Get a comprehensive, AI-powered job search strategy tailored to your career goals and market conditions.</p>
                </div>
        
                {/* Form Fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Role *
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Software Engineer, Data Scientist"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Field/Industry *
                      </label>
                      <input
                        type="text"
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Technology, Healthcare, Finance"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Target Locations *
                    </label>
                    {locations.map((location, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => updateLocation(index, e.target.value)}
                          className="flex-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., San Francisco, Remote, New York"
                        />
                        {locations.length > 1 && (
                          <button
                            onClick={() => removeLocation(index)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addLocation}
                      className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                    >
                      Add Another Location
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        Salary Range (Optional)
                      </label>
                      <input
                        type="text"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., $80k-120k, R500k-800k"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Work Type (Optional)
                      </label>
                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value as any)}
                        className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-site</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-400 font-medium mb-1">Strategy Generation Failed</h4>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={generateJobSearchStrategy}
                  disabled={isGenerating || !role.trim() || !field.trim() || !locations.some(loc => loc.trim())}
                  className="mt-6 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Generating Strategy...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Generate Job Search Strategy
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Job Search Strategy</h2>
                    <p className="text-slate-400 text-sm mt-1">AI-powered strategy from GPT-4o-mini</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-blue-600">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Strategy Results */}
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm mb-6 shadow-2xl shadow-slate-900/50">
                  <div className="max-w-none">
                    <MarkdownRenderer content={strategyResult} />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Create New Strategy
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(strategyResult);
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Strategy
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
