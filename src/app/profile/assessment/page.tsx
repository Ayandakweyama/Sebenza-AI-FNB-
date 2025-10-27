'use client';

import { useState, useEffect } from 'react';
import { Plus, Star, Trash2, Award, TrendingUp, Target, BookOpen } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'certification';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  level: number; // 1-5 scale
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Assessment {
  id: string;
  title: string;
  type: 'technical' | 'behavioral' | 'situational';
  score?: number;
  maxScore?: number;
  status: 'in_progress' | 'completed' | 'expired';
  results?: any;
  feedback?: string;
  createdAt: string;
  completedAt?: string;
}

export default function SkillsAssessmentPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'technical' as const,
    proficiency: 'intermediate' as const,
    level: 3
  });

  useEffect(() => {
    fetchSkillsAndAssessments();
  }, []);

  const fetchSkillsAndAssessments = async () => {
    try {
      const [skillsResponse, assessmentsResponse] = await Promise.all([
        fetch('/api/profile/skills'),
        fetch('/api/profile/assessments')
      ]);

      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setSkills(skillsData.skills || []);
      }

      if (assessmentsResponse.ok) {
        const assessmentsData = await assessmentsResponse.json();
        setAssessments(assessmentsData.assessments || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;

    try {
      const response = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSkill),
      });

      if (response.ok) {
        const data = await response.json();
        setSkills(prev => [data.skill, ...prev]);
        setNewSkill({
          name: '',
          category: 'technical',
          proficiency: 'intermediate',
          level: 3
        });
        setShowAddSkill(false);
      }
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const deleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      const response = await fetch(`/api/profile/skills/${skillId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSkills(prev => prev.filter(skill => skill.id !== skillId));
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  const updateSkillLevel = async (skillId: string, level: number) => {
    try {
      const response = await fetch(`/api/profile/skills/${skillId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level }),
      });

      if (response.ok) {
        setSkills(prev => 
          prev.map(skill => 
            skill.id === skillId ? { ...skill, level } : skill
          )
        );
      }
    } catch (error) {
      console.error('Error updating skill:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return '💻';
      case 'soft': return '🤝';
      case 'language': return '🗣️';
      case 'certification': return '🏆';
      default: return '📚';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'soft': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'language': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'certification': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'beginner': return 'text-red-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-blue-400';
      case 'expert': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const renderStars = (level: number, skillId: string) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => updateSkillLevel(skillId, star)}
            className={`w-4 h-4 ${
              star <= level ? 'text-yellow-400' : 'text-slate-600'
            } hover:text-yellow-300 transition-colors`}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Skills Assessment"
          description="Evaluate and showcase your professional skills and competencies"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Section */}
          <div className="lg:col-span-2">
            {/* Add Skill Section */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Your Skills</h2>
                <button
                  onClick={() => setShowAddSkill(!showAddSkill)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill
                </button>
              </div>

              {showAddSkill && (
                <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Skill Name
                      </label>
                      <input
                        type="text"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., JavaScript, Leadership, Spanish"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Category
                      </label>
                      <select
                        value={newSkill.category}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="technical">Technical</option>
                        <option value="soft">Soft Skills</option>
                        <option value="language">Language</option>
                        <option value="certification">Certification</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Proficiency
                      </label>
                      <select
                        value={newSkill.proficiency}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, proficiency: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Level (1-5)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={newSkill.level}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Beginner</span>
                        <span>Expert</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Add Skill
                    </button>
                    <button
                      onClick={() => setShowAddSkill(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Skills List */}
              {skills.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No skills added yet</h3>
                  <p className="text-slate-400">Add your first skill to get started with your assessment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(skill.category)}</span>
                          <div>
                            <h3 className="font-medium text-white">{skill.name}</h3>
                            <div className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getCategoryColor(skill.category)}`}>
                              {skill.category}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteSkill(skill.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">Proficiency:</span>
                          <span className={`text-sm font-medium ${getProficiencyColor(skill.proficiency)}`}>
                            {skill.proficiency}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">Level:</span>
                          {renderStars(skill.level, skill.id)}
                        </div>
                        
                        {skill.verified && (
                          <div className="flex items-center gap-1 text-green-400 text-xs">
                            <Award className="w-3 h-3" />
                            Verified
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills Overview */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Skills Overview</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Skills</span>
                  <span className="text-white font-semibold">{skills.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Verified</span>
                  <span className="text-green-400 font-semibold">
                    {skills.filter(s => s.verified).length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Expert Level</span>
                  <span className="text-blue-400 font-semibold">
                    {skills.filter(s => s.proficiency === 'expert').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Skill Categories */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              
              <div className="space-y-3">
                {['technical', 'soft', 'language', 'certification'].map((category) => {
                  const count = skills.filter(s => s.category === category).length;
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(category)}</span>
                        <span className="text-slate-300 capitalize">{category}</span>
                      </div>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assessment Progress */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Progress</h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {Math.round((skills.filter(s => s.verified).length / Math.max(skills.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-slate-400">Skills Verified</div>
                </div>
                
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(skills.filter(s => s.verified).length / Math.max(skills.length, 1)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5" />
                  <span className="text-slate-300">
                    Add more technical skills to improve your profile visibility
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-slate-300">
                    Consider taking assessments to verify your skills
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-400 mt-0.5" />
                  <span className="text-slate-300">
                    Add certifications to showcase your expertise
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
