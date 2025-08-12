'use client';

import { useState } from 'react';
import { Plus, X, Search, Briefcase, MapPin, Clock, CheckCircle } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default function JobSearchPage() {
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const addSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };
  
  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };
  
  const generateStrategy = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Job Search Strategy"
          description="Develop an effective job search strategy with AI assistance"
        />
        
        <div className="mt-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
            <p className="mb-6 text-slate-300">Let's create a personalized job search strategy based on your skills and goals.</p>
        
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Preferences */}
                <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                  <h2 className="text-xl font-semibold mb-3 text-white flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
                    Role Preferences
                  </h2>
                  <p className="text-slate-300 mb-4">What kind of roles are you looking for?</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-300">Job Title</label>
                      <input 
                        type="text" 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Frontend Developer" 
                        className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-300">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City, Country, or Remote" 
                          className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-300">Experience Level</label>
                      <select 
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select experience level</option>
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior Level</option>
                        <option value="lead">Lead/Manager</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Skills Section */}
                <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50">
                  <h2 className="text-xl font-semibold mb-3 text-white">Your Skills</h2>
                  <p className="text-slate-300 mb-4">Add your top skills to match with relevant jobs</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-600/30 border border-blue-500/50 px-3 py-1.5 rounded-full text-sm text-blue-100 flex items-center"
                      >
                        {skill}
                        <button 
                          onClick={() => removeSkill(skill)}
                          className="ml-1.5 text-blue-300 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <form onSubmit={addSkill} className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <button 
                      type="submit"
                      className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </button>
                  </form>
                </div>
              </div>
              
              {/* Job Search Plan */}
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                <h2 className="text-xl font-semibold mb-4 text-white">Your Job Search Plan</h2>
                
                <div className="space-y-5 mb-6">
                  {[
                    {
                      step: 1,
                      title: "Optimize Your Online Presence",
                      description: "Update your LinkedIn, GitHub, and portfolio to showcase your skills and experience"
                    },
                    {
                      step: 2,
                      title: "Daily Application Goal",
                      description: "Aim for 5-10 quality job applications per day"
                    },
                    {
                      step: 3,
                      title: "Networking Strategy",
                      description: "Reach out to 3-5 professionals in your target companies weekly"
                    },
                    {
                      step: 4,
                      title: "Skill Development",
                      description: "Dedicate 5 hours per week to learning new skills or improving existing ones"
                    },
                    {
                      step: 5,
                      title: "Interview Preparation",
                      description: "Practice common interview questions and do mock interviews"
                    }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {item.step}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-white">{item.title}</h3>
                        <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={generateStrategy}
                  disabled={isGenerating}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Generate Personalized Strategy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
