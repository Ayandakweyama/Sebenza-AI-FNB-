'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Building, Award, Target, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

interface CareerMilestone {
  id: string;
  title: string;
  description?: string;
  type: 'education' | 'experience' | 'certification' | 'achievement';
  status: 'planned' | 'in_progress' | 'completed';
  targetDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CareerJourney {
  id: string;
  currentGoal?: string;
  timeline?: 'short-term' | 'medium-term' | 'long-term';
  targetRole?: string;
  targetIndustry?: string;
  milestones: CareerMilestone[];
  createdAt: string;
  updatedAt: string;
}

export default function CareerJourneyPage() {
  const [journey, setJourney] = useState<CareerJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    type: 'experience' as const,
    status: 'planned' as const,
    targetDate: ''
  });
  const [goals, setGoals] = useState({
    currentGoal: '',
    timeline: 'medium-term' as const,
    targetRole: '',
    targetIndustry: ''
  });

  useEffect(() => {
    fetchCareerJourney();
  }, []);

  const fetchCareerJourney = async () => {
    try {
      const response = await fetch('/api/profile/career');
      if (response.ok) {
        const data = await response.json();
        if (data.journey) {
          setJourney(data.journey);
          setGoals({
            currentGoal: data.journey.currentGoal || '',
            timeline: data.journey.timeline || 'medium-term',
            targetRole: data.journey.targetRole || '',
            targetIndustry: data.journey.targetIndustry || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching career journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoals = async () => {
    try {
      const response = await fetch('/api/profile/career', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goals),
      });

      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey);
        setEditingGoals(false);
      }
    } catch (error) {
      console.error('Error updating goals:', error);
    }
  };

  const addMilestone = async () => {
    if (!newMilestone.title.trim()) return;

    try {
      const response = await fetch('/api/profile/career/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMilestone),
      });

      if (response.ok) {
        const data = await response.json();
        setJourney(prev => prev ? {
          ...prev,
          milestones: [data.milestone, ...prev.milestones]
        } : null);
        setNewMilestone({
          title: '',
          description: '',
          type: 'experience',
          status: 'planned',
          targetDate: ''
        });
        setShowAddMilestone(false);
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const updateMilestoneStatus = async (milestoneId: string, status: CareerMilestone['status']) => {
    try {
      const response = await fetch(`/api/profile/career/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          completedDate: status === 'completed' ? new Date().toISOString() : undefined
        }),
      });

      if (response.ok) {
        setJourney(prev => prev ? {
          ...prev,
          milestones: prev.milestones.map(milestone =>
            milestone.id === milestoneId 
              ? { 
                  ...milestone, 
                  status,
                  completedDate: status === 'completed' ? new Date().toISOString() : milestone.completedDate
                }
              : milestone
          )
        } : null);
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const response = await fetch(`/api/profile/career/milestones/${milestoneId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJourney(prev => prev ? {
          ...prev,
          milestones: prev.milestones.filter(milestone => milestone.id !== milestoneId)
        } : null);
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'education': return '🎓';
      case 'experience': return '💼';
      case 'certification': return '🏆';
      case 'achievement': return '⭐';
      default: return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'education': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'experience': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'certification': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'achievement': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'planned': return <Target className="w-5 h-5 text-slate-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'planned': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
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
          title="Career Journey"
          description="Track and plan your professional growth and achievements"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Career Goals */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Career Goals</h2>
                <button
                  onClick={() => setEditingGoals(!editingGoals)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  {editingGoals ? 'Cancel' : 'Edit Goals'}
                </button>
              </div>

              {editingGoals ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Current Goal
                    </label>
                    <textarea
                      value={goals.currentGoal}
                      onChange={(e) => setGoals(prev => ({ ...prev, currentGoal: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="Describe your current career goal..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Timeline
                      </label>
                      <select
                        value={goals.timeline}
                        onChange={(e) => setGoals(prev => ({ ...prev, timeline: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="short-term">Short-term (1 year)</option>
                        <option value="medium-term">Medium-term (2-3 years)</option>
                        <option value="long-term">Long-term (5+ years)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Role
                      </label>
                      <input
                        type="text"
                        value={goals.targetRole}
                        onChange={(e) => setGoals(prev => ({ ...prev, targetRole: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Industry
                      </label>
                      <input
                        type="text"
                        value={goals.targetIndustry}
                        onChange={(e) => setGoals(prev => ({ ...prev, targetIndustry: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Technology"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={updateGoals}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Save Goals
                    </button>
                    <button
                      onClick={() => setEditingGoals(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {journey?.currentGoal ? (
                    <div>
                      <h3 className="text-white font-medium mb-2">Current Goal</h3>
                      <p className="text-slate-300">{journey.currentGoal}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No career goals set yet. Click "Edit Goals" to get started.</p>
                  )}
                  
                  {(journey?.targetRole || journey?.targetIndustry || journey?.timeline) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                      {journey.timeline && (
                        <div>
                          <span className="text-slate-400 text-sm">Timeline:</span>
                          <p className="text-white capitalize">{journey.timeline.replace('-', ' ')}</p>
                        </div>
                      )}
                      {journey.targetRole && (
                        <div>
                          <span className="text-slate-400 text-sm">Target Role:</span>
                          <p className="text-white">{journey.targetRole}</p>
                        </div>
                      )}
                      {journey.targetIndustry && (
                        <div>
                          <span className="text-slate-400 text-sm">Target Industry:</span>
                          <p className="text-white">{journey.targetIndustry}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Milestones */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Career Milestones</h2>
                <button
                  onClick={() => setShowAddMilestone(!showAddMilestone)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              </div>

              {showAddMilestone && (
                <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Complete React Certification"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Type
                      </label>
                      <select
                        value={newMilestone.type}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="education">Education</option>
                        <option value="experience">Experience</option>
                        <option value="certification">Certification</option>
                        <option value="achievement">Achievement</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={newMilestone.targetDate}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none"
                        placeholder="Additional details about this milestone..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={addMilestone}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Add Milestone
                    </button>
                    <button
                      onClick={() => setShowAddMilestone(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Milestones Timeline */}
              {journey?.milestones && journey.milestones.length > 0 ? (
                <div className="space-y-4">
                  {journey.milestones
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="relative flex gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
                    >
                      <div className="flex-shrink-0">
                        {getStatusIcon(milestone.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-white mb-1">{milestone.title}</h3>
                            <div className="flex items-center gap-2">
                              <div className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getTypeColor(milestone.type)}`}>
                                <span className="mr-1">{getTypeIcon(milestone.type)}</span>
                                {milestone.type}
                              </div>
                              <div className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getStatusColor(milestone.status)}`}>
                                {milestone.status.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <select
                              value={milestone.status}
                              onChange={(e) => updateMilestoneStatus(milestone.id, e.target.value as any)}
                              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                            >
                              <option value="planned">Planned</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            
                            <button
                              onClick={() => deleteMilestone(milestone.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {milestone.description && (
                          <p className="text-slate-300 text-sm mb-2">{milestone.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          {milestone.targetDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Target: {new Date(milestone.targetDate).toLocaleDateString()}
                            </div>
                          )}
                          {milestone.completedDate && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No milestones yet</h3>
                  <p className="text-slate-400">Add your first milestone to start tracking your career progress</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Progress Overview</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Milestones</span>
                  <span className="text-white font-semibold">{journey?.milestones?.length || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Completed</span>
                  <span className="text-green-400 font-semibold">
                    {journey?.milestones?.filter(m => m.status === 'completed').length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">In Progress</span>
                  <span className="text-blue-400 font-semibold">
                    {journey?.milestones?.filter(m => m.status === 'in_progress').length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Planned</span>
                  <span className="text-slate-400 font-semibold">
                    {journey?.milestones?.filter(m => m.status === 'planned').length || 0}
                  </span>
                </div>
              </div>
              
              {journey?.milestones && journey.milestones.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Completion Rate</span>
                    <span>
                      {Math.round((journey.milestones.filter(m => m.status === 'completed').length / journey.milestones.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(journey.milestones.filter(m => m.status === 'completed').length / journey.milestones.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Milestone Types */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Milestone Types</h3>
              
              <div className="space-y-3">
                {['education', 'experience', 'certification', 'achievement'].map((type) => {
                  const count = journey?.milestones?.filter(m => m.type === type).length || 0;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(type)}</span>
                        <span className="text-slate-300 capitalize">{type}</span>
                      </div>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
