'use client';

import { useState } from 'react';

export default function SkillGapPage() {
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [industry, setIndustry] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRole || !targetRole || (!currentSkills && !jobDescription)) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/afrigter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'skill-gap',
          currentSkills: currentSkills.split(',').map(skill => skill.trim()).filter(Boolean),
          targetRole,
          experienceLevel,
          industry: industry || undefined,
          timeline: '6'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze skill gap');
      }
      
      setResponse(data.response);
    } catch (err) {
      console.error('Skill gap analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing your skills');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setCurrentRole('Frontend Developer');
    setTargetRole('Senior Full Stack Developer');
    setCurrentSkills('JavaScript, React, HTML, CSS, Git');
    setJobDescription('We are looking for a Senior Full Stack Developer with 5+ years of experience in JavaScript, React, Node.js, and databases.');
    setShowExample(true);
  };

  const clearForm = () => {
    setCurrentRole('');
    setTargetRole('');
    setCurrentSkills('');
    setJobDescription('');
    setShowExample(false);
    setResponse('');
    setError('');
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
              Skill Gap Analysis
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base text-center px-2">
            Identify the skills you need to develop to reach your career goals
          </p>
        </div>
        
        <div className="mt-6">
          <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Analyze Your Skill Gaps</h2>
              <button 
                type="button"
                onClick={showExample ? clearForm : loadExample}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showExample ? 'Clear Example' : 'Load Example'}
              </button>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300" htmlFor="current-role">
                  Current Role *
                </label>
                <input 
                  type="text" 
                  id="current-role" 
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
                  placeholder="e.g., Junior Developer"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300" htmlFor="target-role">
                  Target Role *
                </label>
                <input 
                  type="text" 
                  id="target-role" 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
                  placeholder="e.g., Senior Developer"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-slate-300" htmlFor="current-skills">
                  Your Current Skills (comma separated) *
                  <span className="block text-xs text-slate-400 mt-1 font-normal">At least one of skills or job description is required</span>
                </label>
                <input 
                  type="text" 
                  id="current-skills" 
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
                  placeholder="e.g., JavaScript, React, Node.js"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300" htmlFor="experience-level">
                  Experience Level *
                </label>
                <select
                  id="experience-level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  required
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive/Lead</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300" htmlFor="industry">
                  Industry (Optional)
                </label>
                <input 
                  type="text" 
                  id="industry" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-slate-300" htmlFor="job-description">
                Target Job Description (Optional)
                <span className="block text-xs text-slate-400 mt-1 font-normal">Paste the job description you're targeting</span>
              </label>
              <textarea 
                id="job-description" 
                rows={4} 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
                placeholder="Paste the job description you're targeting..."
              ></textarea>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <></>
                ) : 'Analyze My Skills'}
              </button>
              <button 
                type="button" 
                onClick={clearForm}
                className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 border border-slate-600 flex-shrink-0"
              >
                Clear Form
              </button>
            </div>
          </form>
          
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold mb-6 text-white">Your Skill Gap Analysis</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            {response ? (
              <div className="space-y-6">
                <div className="prose prose-invert max-w-none">
                  {response.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-slate-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <h3 className="font-medium text-slate-200 mb-4">Next Steps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="/afrigter/career-advice" 
                      className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors flex items-start"
                    >
                      <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Get Career Advice</h4>
                        <p className="text-sm text-slate-400 mt-1">Personalized guidance for your career growth</p>
                      </div>
                    </a>
                    
                    <a 
                      href="/afrigter/career-roadmap" 
                      className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors flex items-start"
                    >
                      <div className="bg-purple-500/20 p-2 rounded-lg mr-3">
                      </div>
                      <div>
                        <h4 className="font-medium text-white">Create Career Roadmap</h4>
                        <p className="text-sm text-slate-400 mt-1">Plan your path to your target role</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-12 text-slate-400">
                  <p>Your skill gap analysis will appear here after submission.</p>
                  <p className="text-sm mt-2">We'll analyze your current skills and target role to identify gaps and provide recommendations.</p>
                </div>
                
                <div className="hidden space-y-6">
                  <div>
                    <h3 className="font-medium text-slate-200 mb-2">Skills You Already Have</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">JavaScript</span>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">React</span>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">HTML/CSS</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-slate-200 mb-2">Skills to Develop</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">Node.js</span>
                          <span className="text-slate-400">High Priority</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
