'use client';

import React, { useState } from 'react';
import CustomizableCVTemplate, { CVCustomizationOptions } from './CustomizableCVTemplate';
import CVCustomizationPanel from './CVCustomizationPanel';
import { useFormContextData, useMultiStepForm } from './FormContext';
import { ProfileFormData } from '../profile.schema';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, FileText, Loader2, Eye, EyeOff, Save } from 'lucide-react';
import { exportToWord } from '../utils/cvExport';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CVStyleStep() {
  const { prevStep, isLastStep, isSubmitting } = useMultiStepForm();
  const { watch, getValues } = useFormContextData();
  const formData = watch();
  const router = useRouter();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Initialize customization options
  const [customization, setCustomization] = useState<CVCustomizationOptions>({
    layout: 'single-column',
    sidebarPosition: 'left',
    fontFamily: 'Arial, sans-serif',
    fontSize: 'medium',
    lineHeight: 'normal',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    accentColor: '#3b82f6',
    sectionOrder: ['summary', 'experience', 'education', 'skills'],
    visibleSections: {
      photo: false,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      languages: false,
      certifications: false,
      projects: false,
      references: false
    },
    sectionStyle: {
      headerStyle: 'underline',
      headerAlignment: 'left',
      headerCase: 'capitalize',
      spacing: 'normal'
    },
    dateFormat: 'Month YYYY',
    bulletStyle: 'disc',
    skillDisplay: 'tags',
    borderRadius: 'medium',
    shadow: 'medium',
    margins: 'normal'
  });

  const handleExportWord = async () => {
    setIsExporting(true);

    try {
      const filename = `${formData.firstName || 'CV'}_${formData.lastName || 'Resume'}_${Date.now()}`;
      
      const exportOptions = {
        filename: `${filename}.docx`,
        format: 'docx' as const,
        template: 'Professional' as const,
        colorScheme: customization.primaryColor,
        fontFamily: customization.fontFamily,
        showPhoto: customization.visibleSections.photo
      };

      await exportToWord(formData, exportOptions);
      toast.success('CV exported as Word document successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CV as Word document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const completeFormData = getValues();
      
      // Save to localStorage for persistence
      localStorage.setItem('profileFormData', JSON.stringify(completeFormData));
      
      // Save CV customization preferences separately
      localStorage.setItem('cvCustomization', JSON.stringify(customization));
      
      // Save skills to API first
      const skillsToSave: Array<{
        name: string;
        category: string;
        proficiency: string;
        level: number;
      }> = [];

      // Add technical skills
      if (completeFormData.technicalSkills) {
        completeFormData.technicalSkills.forEach(skill => {
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
      }

      // Add soft skills
      if (completeFormData.softSkills) {
        completeFormData.softSkills.forEach((skillName: string) => {
          if (skillName?.trim()) {
            skillsToSave.push({
              name: skillName.trim(),
              category: 'soft',
              proficiency: 'intermediate',
              level: 2
            });
          }
        });
      }

      // Add languages
      if (completeFormData.languages) {
        completeFormData.languages.forEach(lang => {
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
      }

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
      
      // Save complete profile data to API
      
      const profileResponse = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            firstName: completeFormData.firstName || '',
            lastName: completeFormData.lastName || '',
            phone: completeFormData.phone || '',
            location: completeFormData.location || '',
            bio: completeFormData.bio || ''
            // Note: CV customization will be saved to localStorage for now
            // since the UserProfile schema doesn't include these fields yet
          },
          jobPreferences: {
            desiredRoles: completeFormData.jobTypes || completeFormData.jobTitle ? [completeFormData.jobTitle].filter(Boolean) : [],
            industries: completeFormData.industries || [],
            remoteWork: completeFormData.remotePreference === 'Remote',
            skills: [
              ...(completeFormData.technicalSkills?.map(s => s.name) || []),
              ...(completeFormData.softSkills || []),
              ...(completeFormData.languages?.map(l => l.name) || [])
            ].filter(Boolean)
          }
        }),
      });

      const responseData = await profileResponse.json();
      
      if (profileResponse.ok && responseData.success) {
        setSaveMessage('Profile saved successfully! Redirecting to dashboard...');
        toast.success('Your profile has been saved successfully!');
        
        // Trigger profile update event for other components
        const profileUpdateEvent = new CustomEvent('profileDataUpdated');
        window.dispatchEvent(profileUpdateEvent);
        
        // Clear localStorage after successful save
        localStorage.removeItem('profileFormData');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        const errorMessage = responseData.details || responseData.error || `HTTP ${profileResponse.status}: Failed to save profile`;
        console.error('Profile save error:', errorMessage, responseData);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage('Failed to save profile. Please try again.');
      toast.error('Failed to save profile. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">CV Design & Export</h2>
        <p className="text-slate-400">Customize your CV design and export when ready</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Customization */}
        <div className="lg:col-span-1">
          <CVCustomizationPanel
            customization={customization}
            onCustomizationChange={setCustomization}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2">
          {/* Export and View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Export:</span>
              <Button
                onClick={handleExportWord}
                disabled={isExporting}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Export as Word
              </Button>
            </div>
            
            <Button
              onClick={() => setIsFullScreen(!isFullScreen)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              {isFullScreen ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </Button>
          </div>

          {/* CV Preview */}
          <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900 p-8 overflow-auto' : 'border border-slate-700 rounded-lg overflow-hidden bg-slate-900 p-4'}`}>
            <div 
              id="cv-preview-element"
              className={`bg-white rounded shadow-sm overflow-auto ${isFullScreen ? 'max-w-4xl mx-auto' : 'max-h-[800px]'}`}
              style={{
                transform: isFullScreen ? 'scale(1)' : 'scale(0.8)',
                transformOrigin: 'top center'
              }}
            >
              <CustomizableCVTemplate
                data={formData}
                customization={customization}
              />
            </div>
            
            {/* Real-time Update Indicator */}
            <div className="mt-4 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Preview - Updates in Real Time
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg text-center ${
          saveMessage.includes('success')
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-slate-700">
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-3">
          {/* Save Profile Button (separate from form submission) */}
          <Button
            type="button"
            onClick={saveProfile}
            disabled={isSaving}
            variant="outline"
            className="border-green-600/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
          
          {/* Complete Profile Button (triggers form submission) */}
          {isLastStep && (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Profile
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
