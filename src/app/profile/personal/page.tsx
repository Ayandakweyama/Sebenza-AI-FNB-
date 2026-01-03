'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { ExistingDataSummary } from './components/ExistingDataSummary';
import { profileFormSchema, ProfileFormData } from './profile.schema';
import { useAuth } from '@clerk/nextjs';
import { getValidToken, exponentialBackoff } from '@/utils/authHelpers';

// Function to load existing profile data from API
const loadProfileData = async (): Promise<Partial<ProfileFormData> | null> => {
  try {
    const response = await fetch('/api/profile');
    
    if (!response.ok) {
      console.error('Failed to load profile data:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // Transform API data to match ProfileFormData structure
    const transformedProfile: Partial<ProfileFormData> = {
      // Personal info
      firstName: data.profile?.firstName || '',
      lastName: data.profile?.lastName || '',
      email: data.user?.email || '',
      phone: data.profile?.phone || '',
      location: data.profile?.location || '',
      bio: data.profile?.bio || '',

      // Education
      education: data.education?.map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
        current: edu.current || false,
        description: edu.description || ''
      })) || [],

      // Work experience
      workExperience: data.experience?.map((exp: any) => ({
        company: exp.company,
        position: exp.position,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        current: exp.current || false,
        description: exp.description || '',
        achievements: exp.achievements || []
      })) || [],

      // Skills
      technicalSkills: data.skills
        ?.filter((s: any) => s.category === 'technical')
        ?.map((s: any) => ({
          name: s.name,
          level: s.proficiency === 'beginner' ? 'Beginner' :
                 s.proficiency === 'intermediate' ? 'Intermediate' :
                 s.proficiency === 'advanced' ? 'Advanced' : 'Expert'
        })) || [],

      softSkills: data.skills
        ?.filter((s: any) => s.category === 'soft')
        ?.map((s: any) => s.name) || [],

      languages: data.skills
        ?.filter((s: any) => s.category === 'language')
        ?.map((s: any) => ({
          name: s.name,
          proficiency: s.proficiency === 'beginner' ? 'Basic' :
                      s.proficiency === 'intermediate' ? 'Conversational' :
                      s.proficiency === 'expert' ? 'Fluent' : 'Native'
        })) || [],

      // Goals & preferences
      jobTitle: data.jobPreferences?.jobTitle || '',
      industries: data.jobPreferences?.industries || [],
      jobTypes: data.jobPreferences?.desiredRoles || [],
      salaryExpectation: data.jobPreferences?.salaryExpectation,
      relocation: data.jobPreferences?.relocation || false,
      remotePreference: data.jobPreferences?.remoteWork ? 'Remote' : 'Flexible',
      careerGoals: data.jobPreferences?.careerGoals || '',

      // CV Style
      template: data.cvStyle?.template || 'Professional',
      colorScheme: data.cvStyle?.colorScheme || '#2563eb',
      fontFamily: data.cvStyle?.fontFamily || 'Arial',
      showPhoto: data.cvStyle?.showPhoto !== false
    };

    console.log('Loaded profile data from API:', transformedProfile);
    return transformedProfile;
    
  } catch (error) {
    console.error('Error loading profile data:', error);
    return null;
  }
};

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
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [existingData, setExistingData] = useState<Partial<ProfileFormData> | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Load existing profile data on mount with robust authentication timing
  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded || !isSignedIn) {
        setIsLoading(false);
        return;
      }

      // Add initial delay to let Clerk fully initialize
      await exponentialBackoff(0, 1000);

      // Validate token before making API calls
      const token = await getValidToken(getToken, 3);
      if (!token) {
        console.warn('Unable to get valid token, skipping profile data load');
        setIsLoading(false);
        return;
      }

      console.log('Token validated, loading profile data...');
      setIsLoading(true);
      
      try {
        // First try to load from API (most up-to-date)
        const apiData = await loadProfileData();
        
        // Then check localStorage for any unsaved changes
        let localStorageData: Partial<ProfileFormData> | null = null;
        if (typeof window !== 'undefined') {
          const savedData = localStorage.getItem('profileFormData');
          if (savedData) {
            try {
              localStorageData = JSON.parse(savedData);
              console.log('Found localStorage data:', localStorageData);
            } catch (error) {
              console.error('Error parsing localStorage data:', error);
            }
          }
        }

        // Merge data: API data as base, localStorage data overrides if more recent
        let mergedData: Partial<ProfileFormData> = {};
        
        if (apiData) {
          mergedData = { ...apiData };
        }
        
        if (localStorageData) {
          // localStorage data takes precedence (user's recent changes)
          mergedData = { ...mergedData, ...localStorageData };
        }

        setExistingData(mergedData);
        
        // Show notification if we found existing data
        if (apiData || localStorageData) {
          toast.success('Your existing profile data has been loaded');
          // Show summary if there's meaningful data
          const hasData = Object.keys(mergedData).some(key => {
            const value = mergedData[key as keyof ProfileFormData];
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined && value !== '';
          });
          setShowSummary(hasData);
        }
        
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error('Failed to load existing profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isLoaded, isSignedIn, getToken]);

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

  // Set default values from existing data, localStorage, or defaults
  const getDefaultValues = (): Partial<ProfileFormData> => {
    // If we have existing data, use it
    if (existingData) {
      console.log('Using existing profile data as defaults:', existingData);
      return existingData;
    }
    
    // Check localStorage for saved data
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('profileFormData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          const result = profileFormSchema.safeParse(parsedData);
          if (result.success) {
            console.log('Using localStorage data as defaults:', result.data);
            return result.data;
          }
        } catch (error) {
          console.error('Error parsing saved form data:', error);
        }
      }
    }
    
    // Return default values if no existing data
    console.log('Using default values');
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12">
        <DashboardNavigation 
          title="Complete Your Profile"
          description="Fill in your details to get the most out of Sebenza AI"
        />
        
        <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
              <span className="text-slate-400">Loading your profile data...</span>
            </div>
          ) : showSummary && existingData ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome back! Here's your profile so far
                </h2>
                <p className="text-slate-400 mb-6">
                  You can continue where you left off or make changes to any section
                </p>
              </div>
              
              <ExistingDataSummary data={existingData} />
              
              <div className="flex justify-center gap-4 pt-4">
                <Button
                  onClick={() => setShowSummary(false)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue Editing
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clear existing data and start fresh
                    setExistingData(null);
                    setShowSummary(false);
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('profileFormData');
                    }
                    toast.info('Starting with a fresh profile');
                  }}
                >
                  Start Over
                </Button>
              </div>
            </div>
          ) : (
            <MultiStepFormProvider defaultValues={getDefaultValues()} onSubmit={handleSubmit}>
              <FormSteps />
            </MultiStepFormProvider>
          )}
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
