'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, Loader2, RefreshCw, Upload } from 'lucide-react';
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
import { extractTextFromFile } from '@/lib/fileTextExtractor';

// Function to load existing profile data from API
const loadProfileData = async (token: string): Promise<Partial<ProfileFormData> | null> => {
  try {
    const response = await fetch('/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Failed to load profile data:', response.status);
      return null;
    }
    
    const data = await response.json();
    const snapshot = data.profileSnapshot as Partial<ProfileFormData> | null;
    
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
      education: (snapshot?.education || [])?.map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
        current: edu.current || false,
        description: edu.description || ''
      })) || [],

      // Work experience
      workExperience: (snapshot?.workExperience || [])?.map((exp: any) => ({
        company: exp.company,
        position: exp.position,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        current: exp.current || false,
        description: exp.description || '',
        achievements: exp.achievements || []
      })) || [],

      // Skills
      technicalSkills:
        snapshot?.technicalSkills ||
        data.skills
          ?.filter((s: any) => s.category === 'technical')
          ?.map((s: any) => ({
            name: s.name,
            level:
              s.proficiency === 'beginner'
                ? 'Beginner'
                : s.proficiency === 'intermediate'
                  ? 'Intermediate'
                  : s.proficiency === 'advanced'
                    ? 'Advanced'
                    : 'Expert'
          })) ||
        [],

      softSkills:
        snapshot?.softSkills ||
        data.skills
          ?.filter((s: any) => s.category === 'soft')
          ?.map((s: any) => s.name) ||
        [],

      languages:
        snapshot?.languages ||
        data.skills
          ?.filter((s: any) => s.category === 'language')
          ?.map((s: any) => ({
            name: s.name,
            proficiency:
              s.proficiency === 'beginner'
                ? 'Basic'
                : s.proficiency === 'intermediate'
                  ? 'Conversational'
                  : s.proficiency === 'expert'
                    ? 'Fluent'
                    : 'Native'
          })) ||
        [],

      // Goals & preferences
      jobTitle: data.profile?.title || '',
      industries: snapshot?.industries || data.jobPreferences?.industries || [],
      jobTypes: snapshot?.jobTypes || data.jobPreferences?.desiredRoles || [],
      salaryExpectation: snapshot?.salaryExpectation,
      relocation: snapshot?.relocation || false,
      remotePreference: snapshot?.remotePreference || (data.jobPreferences?.remoteWork ? 'Remote' : 'Flexible'),
      careerGoals: snapshot?.careerGoals || '',

      // CV Style
      template: snapshot?.template || 'Professional',
      colorScheme: snapshot?.colorScheme || '#2563eb',
      fontFamily: snapshot?.fontFamily || 'Arial',
      showPhoto: snapshot?.showPhoto !== false
    };

    console.log('Loaded profile data from API:', transformedProfile);
    return transformedProfile;
    
  } catch (error) {
    console.error('Error loading profile data:', error);
    return null;
  }
};

// Function to save profile data to the API
const saveProfileData = async (data: ProfileFormData, token: string) => {
  console.log('Saving profile data:', data);

  // Save profile and job preferences
  const profileResponse = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify({
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
        title: data.jobTitle,
      },
      jobPreferences: {
        desiredRoles: data.jobTypes || [],
        industries: data.industries || [],
        remoteWork: data.remotePreference === 'Remote',
        skills: data.technicalSkills?.map(skill => skill.name).filter(Boolean) || [],
        languages: data.languages?.map(lang => lang.name).filter(Boolean) || [],
      },
      profileSnapshot: data
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
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
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
        const apiData = await loadProfileData(token);
        
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
      const token = await getValidToken(getToken, 3);
      if (!token) throw new Error('Unable to get valid token');

      const result = await saveProfileData(data, token);
      
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
  const { currentStep, isSubmitting, form, goToStep } = useMultiStepFormContext();
  const { getToken } = useAuth();
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();

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
        const values = form.getValues();
        localStorage.setItem('profileFormData', JSON.stringify(values));
        void persistSnapshot(values);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      saveFormData();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, isSubmitting, currentStep]);

  useEffect(() => {
    const step = searchParams.get('step');
    if (
      step === 'personal' ||
      step === 'education' ||
      step === 'experience' ||
      step === 'skills' ||
      step === 'goals' ||
      step === 'cv'
    ) {
      goToStep(step);
    }
  }, [searchParams, goToStep]);

  const applyPatchToForm = (patch: any) => {
    const current = form.getValues();
    const next: any = { ...current };

    const setIf = (key: keyof ProfileFormData, value: any) => {
      if (value === null || value === undefined) return;
      if (typeof value === 'string' && value.trim() === '') return;
      (next as any)[key] = value;
    };

    setIf('firstName', patch.firstName);
    setIf('lastName', patch.lastName);
    setIf('email', patch.email);
    setIf('phone', patch.phone);
    setIf('location', patch.location);
    setIf('bio', patch.bio);
    setIf('jobTitle', patch.jobTitle);
    setIf('careerGoals', patch.careerGoals);
    setIf('remotePreference', patch.remotePreference);
    if (typeof patch.relocation === 'boolean') next.relocation = patch.relocation;

    if (Array.isArray(patch.industries) && patch.industries.length) next.industries = patch.industries;
    if (Array.isArray(patch.jobTypes) && patch.jobTypes.length) next.jobTypes = patch.jobTypes;

    if (Array.isArray(patch.education) && patch.education.length) {
      next.education = patch.education.map((edu: any) => ({
        institution: edu.institution ?? '',
        degree: edu.degree ?? '',
        fieldOfStudy: edu.fieldOfStudy ?? '',
        startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
        current: !!edu.current,
        description: edu.description ?? ''
      }));
    }

    if (Array.isArray(patch.workExperience) && patch.workExperience.length) {
      next.workExperience = patch.workExperience.map((exp: any) => ({
        company: exp.company ?? '',
        position: exp.position ?? '',
        startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        current: !!exp.current,
        description: exp.description ?? '',
        achievements: Array.isArray(exp.achievements) ? exp.achievements : []
      }));
    }

    if (Array.isArray(patch.technicalSkills) && patch.technicalSkills.length) {
      next.technicalSkills = patch.technicalSkills
        .map((s: any) => ({
          name: typeof s?.name === 'string' ? s.name : '',
          level: s?.level || 'Intermediate'
        }))
        .filter((s: any) => s.name.trim());
    }

    if (Array.isArray(patch.softSkills) && patch.softSkills.length) {
      next.softSkills = patch.softSkills.filter((s: any) => typeof s === 'string' && s.trim());
    }

    if (Array.isArray(patch.languages) && patch.languages.length) {
      next.languages = patch.languages
        .map((l: any) => ({
          name: typeof l?.name === 'string' ? l.name : '',
          proficiency: l?.proficiency || 'Conversational'
        }))
        .filter((l: any) => l.name.trim());
    }

    if (Array.isArray(patch.projects) && patch.projects.length) {
      next.projects = patch.projects.map((p: any) => ({
        name: p.name ?? '',
        technologies: p.technologies ?? '',
        description: p.description ?? '',
        link: p.link ?? ''
      }));
    }

    if (Array.isArray(patch.references) && patch.references.length) {
      next.references = patch.references.map((r: any) => ({
        name: r.name ?? '',
        relationship: r.relationship ?? '',
        title: r.title ?? '',
        company: r.company ?? '',
        email: r.email ?? '',
        phone: r.phone ?? '',
        recommendation: r.recommendation ?? ''
      }));
    }

    form.reset(next, { keepDefaultValues: true });
  };

  const persistSnapshot = async (values: ProfileFormData) => {
    try {
      const token = await getValidToken(getToken, 2);
      await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ profileSnapshot: values })
      });
    } catch {}
  };

  const handleCvUpload = async (file: File | null) => {
    if (!file) return;
    setIsParsingCv(true);
    setCvFileName(file.name);
    try {
      const cvText = (await extractTextFromFile(file)).trim();
      if (!cvText) throw new Error('No text could be extracted from that file.');

      setIsImporting(true);
      const response = await fetch('/api/profile/import-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cvText: cvText.slice(0, 12000) })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to import CV');
      }

      applyPatchToForm(data.patch);
      const updated = form.getValues();
      localStorage.setItem('profileFormData', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('profileDataUpdated'));
      void persistSnapshot(updated);
      toast.success('Profile auto-filled from your CV');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import CV');
      setCvFileName(null);
    } finally {
      setIsParsingCv(false);
      setIsImporting(false);
    }
  };

  const clearCv = () => {
    setCvFileName(null);
    if (cvInputRef.current) cvInputRef.current.value = '';
  };

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
      <div className="mb-8">
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-white font-semibold">Auto-fill from your CV</div>
              <div className="text-xs text-slate-400 mt-1">Upload a Word document (DOC or DOCX) to populate your profile automatically.</div>
            </div>
            <input
              ref={cvInputRef}
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleCvUpload(e.target.files?.[0] ?? null)}
              className="hidden"
              disabled={isSubmitting || isParsingCv || isImporting}
            />
            <div className="shrink-0 flex items-center gap-2">
              {cvFileName ? (
                <button
                  type="button"
                  onClick={clearCv}
                  disabled={isSubmitting || isParsingCv || isImporting}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 text-slate-200 font-medium transition-all duration-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                disabled={isSubmitting || isParsingCv || isImporting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-white font-medium transition-all duration-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cvFileName ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Replace
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CV
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {isParsingCv || isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <div className="text-xs text-slate-400">
                  {isParsingCv ? 'Parsing CV…' : 'Importing into your profile…'}
                </div>
              </>
            ) : cvFileName ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="text-xs text-slate-300 break-all">{cvFileName}</div>
              </>
            ) : (
              <div className="text-xs text-slate-500">No CV uploaded yet.</div>
            )}
          </div>
        </div>
      </div>

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
