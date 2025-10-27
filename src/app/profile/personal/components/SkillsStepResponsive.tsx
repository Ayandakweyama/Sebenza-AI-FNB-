'use client';

import { useFormContextData, useMultiStepForm } from './FormContext';
import { useFieldArray } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Globe, 
  Languages, 
  Code, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SkillsStepResponsive() {
  const { nextStep, prevStep } = useMultiStepForm();
  const { 
    control, 
    register, 
    formState: { errors }, 
    watch, 
    setValue,
    getValues 
  } = useFormContextData();
  const router = useRouter();
  
  // State for current inputs
  const [currentTechSkill, setCurrentTechSkill] = useState('');
  const [currentTechLevel, setCurrentTechLevel] = useState('Intermediate');
  const [currentSoftSkill, setCurrentSoftSkill] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [currentProficiency, setCurrentProficiency] = useState('Conversational');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveAndContinue, setSaveAndContinue] = useState(false);
  const [saveAndGoToDashboard, setSaveAndGoToDashboard] = useState(false);
  
  // Watch form values for live updates
  const formValues = watch();
  
  // Technical Skills
  const { fields: techSkills, append: appendTechSkill, remove: removeTechSkill } = useFieldArray({
    control,
    name: 'technicalSkills',
  });

  // Languages
  const { fields: languages, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'languages',
  });

  // Soft Skills (stored as array of strings)
  const softSkills = formValues.softSkills || [];

  // Calculate counts
  const techSkillsCount = techSkills.length;
  const softSkillsCount = softSkills.length;
  const languagesCount = languages.length;
  const totalSkillsCount = techSkillsCount + softSkillsCount + languagesCount;

  // Check if minimum requirements are met
  const hasMinimumSkills = techSkillsCount >= 1 && softSkillsCount >= 1;
  const canProceed = hasMinimumSkills;

  const proficiencyLevels = [
    { value: 'Beginner', label: 'Beginner', color: 'bg-gray-500' },
    { value: 'Intermediate', label: 'Intermediate', color: 'bg-blue-500' },
    { value: 'Advanced', label: 'Advanced', color: 'bg-purple-500' },
    { value: 'Expert', label: 'Expert', color: 'bg-green-500' },
  ];

  const languageProficiency = [
    { value: 'Basic', label: 'Basic', color: 'bg-gray-500' },
    { value: 'Conversational', label: 'Conversational', color: 'bg-blue-500' },
    { value: 'Fluent', label: 'Fluent', color: 'bg-purple-500' },
    { value: 'Native', label: 'Native', color: 'bg-green-500' },
  ];

  const addTechSkill = () => {
    if (currentTechSkill.trim()) {
      appendTechSkill({ 
        name: currentTechSkill.trim(),
        level: currentTechLevel as any
      });
      setCurrentTechSkill('');
      setCurrentTechLevel('Intermediate');
    }
  };

  const addSoftSkill = () => {
    if (currentSoftSkill.trim() && !softSkills.includes(currentSoftSkill.trim())) {
      const newSoftSkills = [...softSkills, currentSoftSkill.trim()];
      setValue('softSkills', newSoftSkills);
      setCurrentSoftSkill('');
    }
  };

  const removeSoftSkill = (index: number) => {
    const newSoftSkills = softSkills.filter((_, i) => i !== index);
    setValue('softSkills', newSoftSkills);
  };

  const addLanguage = () => {
    if (currentLanguage.trim()) {
      appendLanguage({ 
        name: currentLanguage.trim(), 
        proficiency: currentProficiency as any
      });
      setCurrentLanguage('');
      setCurrentProficiency('Conversational');
    }
  };

  // Get color for proficiency level
  const getProficiencyColor = (level: string) => {
    const prof = proficiencyLevels.find(p => p.value === level) || 
                 languageProficiency.find(p => p.value === level);
    return prof?.color || 'bg-gray-500';
  };

  // Save profile function
  const saveProfile = useCallback(async (showMessage = true) => {
    if (isSaving) return; // Prevent multiple simultaneous saves
    
    setIsSaving(true);
    if (showMessage) setSaveMessage('');
    
    try {
      const formData = getValues();
      
      // Save to localStorage for persistence
      localStorage.setItem('profileFormData', JSON.stringify(formData));
      
      // Prepare skills data for API
      const skillsToSave: Array<{
        name: string;
        category: string;
        proficiency: string;
        level: number;
      }> = [];

      // Add technical skills
      techSkills.forEach(skill => {
        if (skill.name?.trim()) {
          skillsToSave.push({
            name: skill.name.trim(),
            category: 'technical',
            proficiency: skill.level === 'Beginner' ? 'beginner' :
                        skill.level === 'Intermediate' ? 'intermediate' :
                        skill.level === 'Advanced' ? 'advanced' : 'expert',
            level: skill.level === 'Beginner' ? 1 :
                   skill.level === 'Intermediate' ? 2 :
                   skill.level === 'Advanced' ? 3 : 4
          });
        }
      });

      // Add soft skills
      softSkills.forEach((skillName: string) => {
        if (skillName?.trim()) {
          skillsToSave.push({
            name: skillName.trim(),
            category: 'soft',
            proficiency: 'intermediate',
            level: 2
          });
        }
      });

      // Add languages
      languages.forEach(lang => {
        if (lang.name?.trim()) {
          skillsToSave.push({
            name: lang.name.trim(),
            category: 'language',
            proficiency: lang.proficiency === 'Basic' ? 'beginner' :
                        lang.proficiency === 'Conversational' ? 'intermediate' :
                        lang.proficiency === 'Fluent' ? 'advanced' :
                        lang.proficiency === 'Native' ? 'expert' : 'intermediate',
            level: lang.proficiency === 'Basic' ? 1 :
                   lang.proficiency === 'Conversational' ? 2 :
                   lang.proficiency === 'Fluent' ? 3 :
                   lang.proficiency === 'Native' ? 4 : 2
          });
        }
      });

      // Save skills to API if any exist
      if (skillsToSave.length > 0) {
        const skillPromises = skillsToSave.map(skill =>
          fetch('/api/skills', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(skill),
          })
        );

        await Promise.allSettled(skillPromises);
      }

      // Save complete profile data
      console.log('Saving complete profile with data:', formData);
      
      const profileResponse = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            phone: formData.phone || '',
            location: formData.location || '',
            bio: formData.bio || '',
            // Include education and experience if available
            education: formData.education || [],
            workExperience: formData.workExperience || [],
            skills: {
              technical: techSkills.map(s => s.name).filter(Boolean),
              soft: softSkills,
              languages: languages.map(l => ({ name: l.name, proficiency: l.proficiency }))
            }
          },
          jobPreferences: {
            desiredRoles: formData.jobTypes || formData.jobTitle ? [formData.jobTitle].filter(Boolean) : [],
            industries: formData.industries || [],
            remoteWork: formData.remotePreference === 'Remote',
            // Combine all skills into one array for job preferences
            skills: [
              ...techSkills.map(s => s.name).filter(Boolean),
              ...softSkills,
              ...languages.map(l => l.name).filter(Boolean)
            ]
          }
        }),
      });

      const responseData = await profileResponse.json();
      
      if (profileResponse.ok && responseData.success) {
        setLastSaved(new Date());
        
        // Trigger profile update event for other components
        const profileUpdateEvent = new CustomEvent('profileDataUpdated');
        window.dispatchEvent(profileUpdateEvent);
        
        if (showMessage) {
          setSaveMessage('Profile saved successfully!');
          setTimeout(() => {
            setSaveMessage('');
            // If save and continue was clicked, move to next step
            if (saveAndContinue) {
              setSaveAndContinue(false);
              nextStep();
            }
            // If save and go to dashboard was clicked, redirect to dashboard
            if (saveAndGoToDashboard) {
              setSaveAndGoToDashboard(false);
              router.push('/dashboard');
            }
          }, 1500);
        }
      } else {
        const errorMessage = responseData.details || responseData.error || 'Failed to save profile';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      if (showMessage) {
        setSaveMessage('Failed to save. Please try again.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, techSkills, softSkills, languages, getValues]);

  // Auto-save functionality with debounce (disabled to prevent excessive saves)
  // useEffect(() => {
  //   if (!autoSaveEnabled) return;
  //   
  //   const autoSaveTimer = setTimeout(() => {
  //     if (totalSkillsCount > 0) {
  //       saveProfile(false); // Auto-save without showing message
  //     }
  //   }, 2000); // Auto-save after 2 seconds of inactivity

  //   return () => clearTimeout(autoSaveTimer);
  // }, [formValues, autoSaveEnabled, totalSkillsCount, saveProfile]);

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Skills & Languages</h2>
        <p className="text-blue-100 mb-4">Showcase your technical abilities and language skills</p>
        
        {/* Skills Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Code className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <p className="text-xs text-blue-200">Technical Skills</p>
                  <p className="text-2xl font-bold">{techSkillsCount}</p>
                </div>
              </div>
              {techSkillsCount > 0 && <CheckCircle className="h-5 w-5 text-green-400" />}
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-200" />
                </div>
                <div>
                  <p className="text-xs text-purple-200">Soft Skills</p>
                  <p className="text-2xl font-bold">{softSkillsCount}</p>
                </div>
              </div>
              {softSkillsCount > 0 && <CheckCircle className="h-5 w-5 text-green-400" />}
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Globe className="h-5 w-5 text-green-200" />
                </div>
                <div>
                  <p className="text-xs text-green-200">Languages</p>
                  <p className="text-2xl font-bold">{languagesCount}</p>
                </div>
              </div>
              {languagesCount > 0 && <CheckCircle className="h-5 w-5 text-green-400" />}
            </div>
          </motion.div>
        </div>

        {/* Progress Indicator and Auto-save Status */}
        <div className="space-y-3">
          {!canProceed && (
            <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
              {/* Manual Save Only - Auto-save disabled for performance */}
              {lastSaved && (
                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Technical Skills Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Code className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Technical Skills</h3>
          </div>
          <span className="text-sm text-slate-400">{techSkillsCount} added</span>
        </div>

        {/* Existing Technical Skills */}
        <AnimatePresence>
          <div className="space-y-3 mb-4">
            {techSkills.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <Input
                    {...register(`technicalSkills.${index}.name`)}
                    placeholder="Skill name"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    {...register(`technicalSkills.${index}.level`)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                  >
                    {proficiencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <div className={`w-2 h-2 rounded-full ${getProficiencyColor(field.level)}`} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTechSkill(index)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Add Technical Skill */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={currentTechSkill}
            onChange={(e) => setCurrentTechSkill(e.target.value)}
            placeholder="e.g., React, Python, AWS"
            className="flex-1 bg-slate-900 border-slate-700"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechSkill())}
          />
          <select
            value={currentTechLevel}
            onChange={(e) => setCurrentTechLevel(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white"
          >
            {proficiencyLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={addTechSkill}
            disabled={!currentTechSkill.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Soft Skills Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Soft Skills</h3>
          </div>
          <span className="text-sm text-slate-400">{softSkillsCount} added</span>
        </div>

        {/* Soft Skills Tags */}
        <AnimatePresence>
          <div className="flex flex-wrap gap-2 mb-4">
            {softSkills.map((skill, index) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-full"
              >
                <span className="text-sm text-purple-200">{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSoftSkill(index)}
                  className="ml-2 text-purple-300 hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Add Soft Skill */}
        <div className="flex gap-2">
          <Input
            value={currentSoftSkill}
            onChange={(e) => setCurrentSoftSkill(e.target.value)}
            placeholder="e.g., Leadership, Communication, Problem Solving"
            className="flex-1 bg-slate-900 border-slate-700"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSoftSkill())}
          />
          <Button
            type="button"
            onClick={addSoftSkill}
            disabled={!currentSoftSkill.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Languages Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Globe className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Languages</h3>
          </div>
          <span className="text-sm text-slate-400">{languagesCount} added</span>
        </div>

        {/* Existing Languages */}
        <AnimatePresence>
          <div className="space-y-3 mb-4">
            {languages.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <Input
                    {...register(`languages.${index}.name`)}
                    placeholder="Language"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    {...register(`languages.${index}.proficiency`)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                  >
                    {languageProficiency.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <div className={`w-2 h-2 rounded-full ${getProficiencyColor(field.proficiency)}`} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLanguage(index)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Add Language */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            placeholder="e.g., English, Spanish, Mandarin"
            className="flex-1 bg-slate-900 border-slate-700"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
          />
          <select
            value={currentProficiency}
            onChange={(e) => setCurrentProficiency(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white"
          >
            {languageProficiency.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={addLanguage}
            disabled={!currentLanguage.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Navigation and Save */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Save Progress Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => saveProfile(true)}
            disabled={isSaving || totalSkillsCount === 0}
            className="border-green-600/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 hover:border-green-500/50 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Progress
              </>
            )}
          </Button>
          
          {/* Save & Continue Button */}
          {canProceed && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSaveAndContinue(true);
                saveProfile(true);
              }}
              disabled={isSaving}
              className="border-blue-600/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/50 w-full sm:w-auto"
            >
              {isSaving && saveAndContinue ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Continue
                </>
              )}
            </Button>
          )}

          {/* Save & Go to Dashboard Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSaveAndGoToDashboard(true);
              saveProfile(true);
            }}
            disabled={isSaving || totalSkillsCount === 0}
            className="border-purple-600/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/50 w-full sm:w-auto"
          >
            {isSaving && saveAndGoToDashboard ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save & Go to Dashboard
              </>
            )}
          </Button>
          
          {!canProceed && (
            <p className="text-sm text-yellow-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Add required skills
            </p>
          )}
          
          {/* Next Button (without save) */}
          <Button 
            type="button" 
            onClick={nextStep}
            disabled={!canProceed}
            className={`${
              canProceed 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-slate-700 cursor-not-allowed opacity-50'
            } text-white transition-all w-full sm:w-auto`}
          >
            Skip to Career Goals
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mt-4 p-4 rounded-lg ${
            saveMessage.includes('success')
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            {saveMessage.includes('success') ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span className="font-medium">{saveMessage}</span>
          </div>
          {saveMessage.includes('success') && (
            <div className="mt-2 text-sm text-green-200/80">
              Saved: {techSkillsCount} technical skills, {softSkillsCount} soft skills, {languagesCount} languages
            </div>
          )}
        </motion.div>
      )}

      {/* Skills Overview Summary */}
      {totalSkillsCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Total Skills Added: {totalSkillsCount}</span>
            </div>
            {canProceed && (
              <span className="text-green-400 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Ready to proceed
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
