'use client';

import { useState, useEffect } from 'react';
import { useMultiStepFormContext } from './FormContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Code, Users, Globe, RefreshCw } from 'lucide-react';
import { SkillsManager } from './SkillsManager';
import { toast } from 'sonner';

export function SkillsStepEnhanced() {
  const { nextStep, prevStep, form } = useMultiStepFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [skillsData, setSkillsData] = useState<any>({
    technical: [],
    soft: [],
    languages: []
  });

  // Load existing skills when component mounts
  useEffect(() => {
    loadAllSkills();
  }, []);

  const loadAllSkills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/skills');
      if (response.ok) {
        const skills = await response.json();
        
        // Group skills by category
        const grouped = {
          technical: skills.filter((s: any) => s.category === 'technical'),
          soft: skills.filter((s: any) => s.category === 'soft'),
          languages: skills.filter((s: any) => s.category === 'language')
        };
        
        setSkillsData(grouped);
        
        // Update form data for compatibility with other components
        form.setValue('technicalSkills', grouped.technical.map((s: any) => ({
          name: s.name,
          level: s.proficiency === 'beginner' ? 'Beginner' :
                 s.proficiency === 'intermediate' ? 'Intermediate' :
                 s.proficiency === 'advanced' ? 'Advanced' : 'Expert'
        })));
        
        form.setValue('softSkills', grouped.soft.map((s: any) => s.name));
        
        form.setValue('languages', grouped.languages.map((s: any) => ({
          name: s.name,
          proficiency: s.proficiency === 'beginner' ? 'Basic' :
                      s.proficiency === 'intermediate' ? 'Conversational' :
                      s.proficiency === 'advanced' ? 'Fluent' : 'Native'
        })));
      }
    } catch (error) {
      console.error('Error loading skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    // Validate that at least some skills are added
    const totalSkills = skillsData.technical.length + 
                       skillsData.soft.length + 
                       skillsData.languages.length;
    
    if (totalSkills === 0) {
      toast.warning('Please add at least one skill before proceeding');
      return;
    }
    
    nextStep();
  };

  const languageProficiencyOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'fluent', label: 'Fluent' },
    { value: 'native', label: 'Native' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Skills & Languages</h2>
        <p className="text-slate-400">Manage your technical abilities, soft skills, and language proficiencies</p>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadAllSkills}
          disabled={isLoading}
          className="text-slate-400 border-slate-700 hover:text-white hover:border-slate-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Skills
        </Button>
      </div>

      {/* Technical Skills Section */}
      <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800">
        <SkillsManager
          category="technical"
          title="Technical Skills"
          icon={<Code className="h-5 w-5 text-blue-400" />}
        />
      </div>

      {/* Soft Skills Section */}
      <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800">
        <SkillsManager
          category="soft"
          title="Soft Skills"
          icon={<Users className="h-5 w-5 text-green-400" />}
        />
      </div>

      {/* Languages Section */}
      <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800">
        <SkillsManager
          category="language"
          title="Languages"
          icon={<Globe className="h-5 w-5 text-purple-400" />}
          proficiencyOptions={languageProficiencyOptions}
        />
      </div>

      {/* Skills Summary */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Skills Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-400">{skillsData.technical.length}</p>
            <p className="text-sm text-slate-400">Technical Skills</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{skillsData.soft.length}</p>
            <p className="text-sm text-slate-400">Soft Skills</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">{skillsData.languages.length}</p>
            <p className="text-sm text-slate-400">Languages</p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          type="button" 
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Career Goals
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
