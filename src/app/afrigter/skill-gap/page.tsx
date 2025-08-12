'use client';

import { useState } from 'react';
import { useAfrigter } from '@/hooks/useAfrigter';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default function SkillGapPage() {
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid-level');
  const [industry, setIndustry] = useState('');
  const [showExample, setShowExample] = useState(false);
  
  const { response, loading, callAfrigter } = useAfrigter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRole || !targetRole || (!currentSkills && !jobDescription)) {
      alert('Please fill in all required fields');
      return;
    }
    
    const data = {
      type: 'skill-gap' as const,
      currentSkills: currentSkills.split(',').map(skill => skill.trim()).filter(Boolean),
      targetRole,
      experienceLevel,
      industry: industry || undefined,
      jobDescription: jobDescription || undefined
    };
    
    await callAfrigter(data);
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
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Skill Gap Analysis"
          description="Identify the skills you need to develop to reach your career goals"
        />
        
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
                  <option value="entry-level">Entry Level</option>
                  <option value="mid-level">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead/Manager</option>
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
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
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
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
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
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
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
