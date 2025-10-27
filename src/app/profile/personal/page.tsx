'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { MultiStepFormProvider, useMultiStepFormContext } from './components/FormContext';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { EducationStep } from './components/EducationStep';
import { ExperienceStep } from './components/ExperienceStep';
import { SkillsStep } from './components/SkillsStep';
import { SkillsStepEnhanced } from './components/SkillsStepEnhanced';
import { SkillsStepResponsive } from './components/SkillsStepResponsive';
import { GoalsStep } from './components/GoalsStep';
import { CVStyleStep } from './components/CVStyleStep';
import { profileFormSchema, ProfileFormData } from './profile.schema';

// Function to save profile data to the API
const saveProfileData = async (data: ProfileFormData) => {
  console.log('Saving profile data:', data);

  // Save profile and job preferences
  const profileResponse = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
      },
      jobPreferences: {
        desiredRoles: data.jobTypes || [],
        industries: data.industries || [],
        remoteWork: data.remotePreference === 'Remote',
        skills: data.technicalSkills?.map(skill => skill.name).filter(Boolean) || [],
        languages: data.languages?.map(lang => lang.name).filter(Boolean) || [],
      }
    }),
  });

  if (!profileResponse.ok) {
    const errorData = await profileResponse.json();
    throw new Error(errorData.error || 'Failed to save profile');
  }

  // Save skills
  if (data.technicalSkills?.length || data.softSkills?.length || data.languages?.length) {
    const skillsToSave: Array<{
      name: string;
      category: string;
      proficiency: string;
      level: number;
    }> = [];

    // Add technical skills
    if (data.technicalSkills) {
      data.technicalSkills.forEach(skill => {
        if (skill.name.trim()) {
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
    if (data.softSkills) {
      data.softSkills.forEach(skillName => {
        if (skillName.trim()) {
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
    if (data.languages) {
      data.languages.forEach(lang => {
        if (lang.name.trim()) {
          skillsToSave.push({
            name: lang.name.trim(),
            category: 'language',
            proficiency: lang.proficiency === 'Conversational' ? 'beginner' :
                        lang.proficiency === 'Fluent' ? 'intermediate' :
                        lang.proficiency === 'Native' ? 'expert' : 'intermediate',
            level: lang.proficiency === 'Conversational' ? 1 :
                   lang.proficiency === 'Fluent' ? 2 :
                   lang.proficiency === 'Native' ? 4 : 2
          });
        }
      });
    }

    // Save skills in parallel
    const skillPromises = skillsToSave.map(skill =>
      fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skill),
      })
    );

    const skillResults = await Promise.allSettled(skillPromises);
    const failedSkills = skillResults.filter(result => result.status === 'rejected');

    if (failedSkills.length > 0) {
      console.warn(`${failedSkills.length} skills failed to save`);
    }
  }

  const result = await profileResponse.json();
  return { success: true, data: result };
};

export default function PersonalProfilePage() {
  const router = useRouter();

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      // Save the form data
      const result = await saveProfileData(data);
      
      if (result.success) {
        // Clear saved form data from localStorage on successful submission
        if (typeof window !== 'undefined') {
          localStorage.removeItem('profileFormData');
        }
        
        toast.success('Profile saved successfully!');
        // Redirect to profile page or dashboard after successful save
        router.push('/profile');
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  // Set default values from localStorage if available
  const getDefaultValues = (): Partial<ProfileFormData> => {
    if (typeof window === 'undefined') return {};
    
    const savedData = localStorage.getItem('profileFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Validate the parsed data against the schema
        const result = profileFormSchema.safeParse(parsedData);
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    
    // Return default values if no saved data or parsing failed
    return {
      education: [{
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: new Date(),
        current: false,
      }],
      workExperience: [{
        company: '',
        position: '',
        startDate: new Date(),
        current: false,
        description: '',
        achievements: ['']
      }],
      technicalSkills: [{ name: '', level: 'Intermediate' }],
      softSkills: [],
      languages: [{ name: '', proficiency: 'Conversational' }],
      jobTypes: [],
      industries: [],
      remotePreference: 'Flexible',
      template: 'Professional',
      colorScheme: '#2563eb',
      fontFamily: 'Arial',
      showPhoto: true,
    };
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Complete Your Profile"
          description="Fill in your details to get the most out of Sebenza AI"
        />
        
        <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <MultiStepFormProvider defaultValues={getDefaultValues()} onSubmit={handleSubmit}>
            <FormSteps />
          </MultiStepFormProvider>
        </div>
      </div>
    </div>
  );
}

// Component to handle form steps rendering
function FormSteps() {
  const { currentStep, isSubmitting, form } = useMultiStepFormContext();

  // Save form data to localStorage on step change
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning if form is being submitted
      if (isSubmitting) return;
      
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    // Save form data to localStorage when component unmounts or step changes
    const saveFormData = () => {
      if (form.formState.isDirty) {
        localStorage.setItem('profileFormData', JSON.stringify(form.getValues()));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      saveFormData();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, isSubmitting]);

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'personal':
        return <PersonalInfoStep />;
      case 'education':
        return <EducationStep />;
      case 'experience':
        return <ExperienceStep />;
      case 'skills':
        return <SkillsStepResponsive />;
      case 'goals':
        return <GoalsStep />;
      case 'cv':
        return <CVStyleStep />;
      default:
        return <PersonalInfoStep />;
    }
  };

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {['personal', 'education', 'experience', 'skills', 'goals', 'cv'].map((step, index) => (
            <div key={step} className="text-center relative flex-1">
              <div 
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < ['personal', 'education', 'experience', 'skills', 'goals', 'cv'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {index + 1}
              </div>
              <div className="text-xs mt-1 text-slate-400 capitalize">
                {step.replace('-', ' ')}
              </div>
            </div>
          ))}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700 -z-10">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${((['personal', 'education', 'experience', 'skills', 'goals', 'cv'].indexOf(currentStep) + 1) / 6) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="min-h-[500px]">
        {renderStep()}
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300">Saving your profile...</p>
          </div>
        </div>
      )}
    </div>
  );
}
