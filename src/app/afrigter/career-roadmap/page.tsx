'use client';

import { useEffect, useRef, useState } from 'react';
import { useAfrigter } from '@/hooks/useAfrigter';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { extractTextFromFile } from '@/lib/fileTextExtractor';
import { CheckCircle, Loader2, RefreshCw, Upload } from 'lucide-react';
import RoadmapStepViewer from './RoadmapStepViewer';

export default function CareerRoadmapPage() {
  const [mounted, setMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [timeline, setTimeline] = useState('6');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'executive'>('mid');
  const [skills, setSkills] = useState('');
  const [goals, setGoals] = useState('');
  const [industry, setIndustry] = useState('');
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvText, setCvText] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  
  const { response, loading, error, callAfrigter } = useAfrigter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const handleCvUpload = async (file: File | null) => {
    if (!file) return;
    setIsParsingCv(true);
    setCvFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      const clean = (text || '').trim();
      if (!clean) throw new Error('No text could be extracted from that file.');
      setCvText(clean);
    } catch (err) {
      setCvText(null);
      setCvFileName(null);
      alert(err instanceof Error ? err.message : 'Failed to extract text from the uploaded CV');
    } finally {
      setIsParsingCv(false);
    }
  };

  const clearCv = () => {
    setCvText(null);
    setCvFileName(null);
    if (cvInputRef.current) cvInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRole.trim() || !targetRole.trim()) {
      alert('Please fill in your current role and target role.');
      return;
    }
    
    await callAfrigter({
      type: 'career-roadmap',
      currentRole,
      targetRole,
      timeline,
      experienceLevel,
      currentSkills: skills.split(',').map(skill => skill.trim()).filter(Boolean),
      goals: goals || undefined,
      industry: industry || undefined,
      cvText: cvText ? cvText.slice(0, 12000) : undefined
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
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Career Roadmap Generator</h1>
            <p className="text-sm sm:text-base mb-8 text-slate-300">Upload your CV (optional) and generate a step-by-step plan with milestones and actions.</p>
            
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="experience-level" className="block text-sm font-medium mb-2 text-slate-300">
                    Experience Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="experience-level"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    required
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="executive">Executive/Lead</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium mb-2 text-slate-300">
                    Industry (Optional)
                  </label>
                  <input
                    type="text"
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="e.g. FinTech"
                  />
                </div>

                <div>
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
                    <span>3</span>
                    <span>{timeline}</span>
                    <span>24</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-slate-300" htmlFor="cv-upload">
                  Upload Your CV (Optional)
                  <span className="block text-xs text-slate-400 mt-1 font-normal">We’ll extract your experience and skills to personalize the roadmap</span>
                </label>
                <div className="border border-dashed border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors bg-slate-900/30">
                  <input
                    ref={cvInputRef}
                    type="file"
                    id="cv-upload"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => handleCvUpload(e.target.files?.[0] ?? null)}
                    disabled={isParsingCv || loading}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    {isParsingCv ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        <span className="text-xs text-slate-400">Parsing CV…</span>
                      </>
                    ) : cvText && cvFileName ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-xs text-slate-300 break-all text-center">{cvFileName}</span>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => cvInputRef.current?.click()}
                            className="px-4 py-2 bg-slate-800/60 hover:bg-slate-800 text-white font-medium rounded-lg transition-all duration-200 border border-slate-700 w-full sm:w-auto text-sm inline-flex items-center justify-center"
                            disabled={loading}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={clearCv}
                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 border border-slate-600 w-full sm:w-auto text-sm"
                            disabled={loading}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-500 text-center">Upload Word document (DOC or DOCX)</span>
                        <button
                          type="button"
                          onClick={() => cvInputRef.current?.click()}
                          className="px-4 py-2 bg-slate-800/60 hover:bg-slate-800 text-white font-medium rounded-lg transition-all duration-200 border border-slate-700 text-sm inline-flex items-center justify-center"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Word CV
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium mb-2 text-slate-300">
                    Your Current Skills (comma separated)
                  </label>
                  <textarea
                    id="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] text-white"
                    placeholder="e.g. JavaScript, React, Node.js, CSS"
                  />
                </div>

                <div>
                  <label htmlFor="goals" className="block text-sm font-medium mb-2 text-slate-300">
                    Your Career Goals (Optional)
                  </label>
                  <textarea
                    id="goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] text-white"
                    placeholder="e.g. Move into leadership, build a stronger portfolio, get a remote role..."
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || isParsingCv}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Your Roadmap…
                  </>
                ) : (
                  'Generate Career Roadmap'
                )}
              </button>
            </form>
            
            {error ? (
              <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            ) : null}

            <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">Your Career Roadmap</h2>
              {response ? (
                <RoadmapStepViewer markdown={response} />
              ) : loading ? (
                <div className="py-14 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-400 mb-3" />
                  <p className="text-sm text-slate-300">Generating your roadmap…</p>
                  <p className="text-xs text-slate-500 mt-2">Using your role, target role, and CV/skills</p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p>Your step-by-step roadmap will appear here after generation.</p>
                  <p className="text-sm mt-2 text-slate-500">Use the numbered steps to navigate with a 3D transition effect.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
