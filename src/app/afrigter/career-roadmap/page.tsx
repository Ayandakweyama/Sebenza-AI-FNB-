'use client';

import { useState } from 'react';
import { useAfrigter } from '@/hooks/useAfrigter';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function CareerRoadmapPage() {
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [timeline, setTimeline] = useState('6');
  const [skills, setSkills] = useState('');
  const [goals, setGoals] = useState('');
  
  const { response, loading, callAfrigter } = useAfrigter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRole || !targetRole) {
      alert('Please fill in all required fields');
      return;
    }
    
    await callAfrigter({
      type: 'career-roadmap',
      currentRole,
      targetRole,
      timeline,
      skills: skills.split(',').map(skill => skill.trim()).filter(Boolean),
      goals
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12">
        <DashboardNavigation 
          title="Career Roadmap"
          description="Create a personalized career development plan to achieve your professional goals"
        />
        
        <div className="mt-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-white">Career Roadmap Generator</h1>
            <p className="text-lg mb-8 text-slate-300">Create a personalized learning and certification plan to achieve your career goals.</p>
            
            <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="current-role" className="block text-sm font-medium mb-2 text-slate-300">
                    Your Current Role <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="current-role"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="e.g. Frontend Developer"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="target-role" className="block text-sm font-medium mb-2 text-slate-300">
                    Target Role <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="target-role"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="e.g. Senior Full Stack Engineer"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="timeline" className="block text-sm font-medium mb-2 text-slate-300">
                  Target Timeline (months)
                </label>
                <input
                  type="range"
                  id="timeline"
                  min="3"
                  max="24"
                  step="1"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>3 months</span>
                  <span>{timeline} months</span>
                  <span>24 months</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="skills" className="block text-sm font-medium mb-2 text-slate-300">
                  Your Current Skills (comma separated)
                </label>
                <textarea
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] text-white"
                  placeholder="e.g. JavaScript, React, Node.js, CSS"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="goals" className="block text-sm font-medium mb-2 text-slate-300">
                  Your Career Goals
                </label>
                <textarea
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] text-white"
                  placeholder="Describe your career goals and any specific areas you want to focus on..."
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Your Roadmap...' : 'Generate Career Roadmap'}
              </button>
            </form>
            
            {response ? (
              <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-2xl font-bold mb-4 text-white">Your Career Roadmap</h2>
                <MarkdownRenderer content={response} />
              </div>
            ) : (
              <div className="mt-8 text-center p-6 border-2 border-dashed border-slate-700 rounded-xl">
                <p className="text-slate-300">Your personalized career roadmap will appear here after generation.</p>
                <p className="text-sm mt-2 text-slate-400">We'll analyze your current skills and goals to create a step-by-step plan for your career growth.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
