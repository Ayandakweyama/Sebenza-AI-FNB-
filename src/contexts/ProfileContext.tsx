'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getValidToken, exponentialBackoff } from '@/utils/authHelpers';
import { ProfileFormData } from '@/app/profile/personal/profile.schema';
import { profileDataService } from '@/services/profileDataService';

function parseMaybeDate(value: any) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function normalizeProfileSnapshot(snapshot: any, emailFromAuth?: string): ProfileFormData | null {
  if (!snapshot || typeof snapshot !== 'object') return null;

  const education = Array.isArray(snapshot.education)
    ? snapshot.education.map((edu: any) => ({
        ...edu,
        startDate: parseMaybeDate(edu?.startDate) || new Date(),
        endDate: parseMaybeDate(edu?.endDate),
        current: Boolean(edu?.current),
      }))
    : [];

  const workExperience = Array.isArray(snapshot.workExperience)
    ? snapshot.workExperience.map((exp: any) => ({
        ...exp,
        startDate: parseMaybeDate(exp?.startDate) || new Date(),
        endDate: parseMaybeDate(exp?.endDate),
        current: Boolean(exp?.current),
        achievements: Array.isArray(exp?.achievements) ? exp.achievements : [],
      }))
    : [];

  const normalized: ProfileFormData = {
    firstName: snapshot.firstName || '',
    lastName: snapshot.lastName || '',
    email: snapshot.email || emailFromAuth || '',
    phone: snapshot.phone || '',
    location: snapshot.location || '',
    bio: snapshot.bio || '',
    profilePhoto: undefined,
    education,
    workExperience,
    technicalSkills: Array.isArray(snapshot.technicalSkills) ? snapshot.technicalSkills : [],
    softSkills: Array.isArray(snapshot.softSkills) ? snapshot.softSkills : [],
    languages: Array.isArray(snapshot.languages) ? snapshot.languages : [],
    projects: Array.isArray(snapshot.projects) ? snapshot.projects : undefined,
    references: Array.isArray(snapshot.references) ? snapshot.references : undefined,
    jobTitle: snapshot.jobTitle || '',
    industries: Array.isArray(snapshot.industries) ? snapshot.industries : [],
    jobTypes: Array.isArray(snapshot.jobTypes) ? snapshot.jobTypes : [],
    salaryExpectation: typeof snapshot.salaryExpectation === 'number' ? snapshot.salaryExpectation : undefined,
    relocation: Boolean(snapshot.relocation),
    remotePreference: snapshot.remotePreference || 'Flexible',
    careerGoals: snapshot.careerGoals || '',
    template: snapshot.template || 'Professional',
    colorScheme: snapshot.colorScheme || '#2563eb',
    fontFamily: snapshot.fontFamily || 'Arial',
    showPhoto: snapshot.showPhoto !== false,
    customSections: Array.isArray(snapshot.customSections) ? snapshot.customSections : [],
  };

  return normalized;
}

interface ProfileContextType {
  // Profile data
  profile: ProfileFormData | null;
  isLoading: boolean;
  error: string | null;
  
  // Profile actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileFormData>) => Promise<boolean>;
  saveProfile: (data: Partial<ProfileFormData>) => Promise<boolean>;
  
  // Profile completion
  completionPercentage: number;
  isProfileComplete: boolean;
  
  // Profile sections (using flattened structure from z.intersection)
  personalInfo: Pick<ProfileFormData, 'firstName' | 'lastName' | 'email' | 'phone' | 'location' | 'bio' | 'profilePhoto'> | null;
  education: Pick<ProfileFormData, 'education'> | null;
  workExperience: Pick<ProfileFormData, 'workExperience'> | null;
  skills: Pick<ProfileFormData, 'technicalSkills' | 'softSkills' | 'languages'> | null;
  goals: Pick<ProfileFormData, 'jobTitle' | 'industries' | 'jobTypes' | 'salaryExpectation' | 'relocation' | 'remotePreference' | 'careerGoals'> | null;
  cvStyle: Pick<ProfileFormData, 'template' | 'colorScheme' | 'fontFamily' | 'showPhoto' | 'customSections'> | null;
  
  // Utility methods
  getProfileSection: <K extends keyof ProfileFormData>(section: K) => ProfileFormData[K] | null;
  hasSection: <K extends keyof ProfileFormData>(section: K) => boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize profile data from service
  useEffect(() => {
    const serviceData = profileDataService.getProfileData() || profileDataService.loadFromStorage();
    if (serviceData) {
      setProfile(serviceData as ProfileFormData);
    }
  }, []);

  // Subscribe to profile data service changes
  useEffect(() => {
    const unsubscribe = profileDataService.subscribe((data) => {
      setProfile(data as ProfileFormData);
    });
    
    return unsubscribe;
  }, []);

  // Load profile from API
  const loadProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getValidToken(getToken, 3);
      if (!token) {
        console.warn('Unable to get valid token for profile');
        setError('Authentication failed');
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const snapshot = normalizeProfileSnapshot(data.profileSnapshot, data.user?.email);
        const desiredRoles = Array.isArray(data.jobPreferences?.desiredRoles) ? data.jobPreferences.desiredRoles : [];
        const jobTypes = Array.isArray(data.jobPreferences?.jobType) ? data.jobPreferences.jobType : [];
        const industries = Array.isArray(data.jobPreferences?.industries) ? data.jobPreferences.industries : [];
        const salaryMin = typeof data.jobPreferences?.salaryMin === 'number' ? data.jobPreferences.salaryMin : undefined;

        const transformedProfile: ProfileFormData =
          snapshot ||
          ({
            firstName: data.profile?.firstName || '',
            lastName: data.profile?.lastName || '',
            email: data.user?.email || '',
            phone: data.profile?.phone || '',
            location: data.profile?.location || '',
            bio: data.profile?.bio || '',
            profilePhoto: undefined,
            education: [],
            workExperience: [],
            technicalSkills: data.skills
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
                        : 'Expert',
              })) || [],
            softSkills: data.skills?.filter((s: any) => s.category === 'soft')?.map((s: any) => s.name) || [],
            languages:
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
                          : 'Native',
                })) || [],
            projects: undefined,
            references: undefined,
            jobTitle: String(desiredRoles?.[0] || ''),
            industries,
            jobTypes,
            salaryExpectation: salaryMin,
            relocation: false,
            remotePreference: data.jobPreferences?.remoteWork ? 'Remote' : 'Flexible',
            careerGoals: '',
            template: 'Professional',
            colorScheme: '#2563eb',
            fontFamily: 'Arial',
            showPhoto: true,
            customSections: [],
          } as ProfileFormData);

        setProfile(transformedProfile);
        
        // Also update the profile data service
        profileDataService.setProfileData(transformedProfile);
      } else if (response.status === 401) {
        console.warn('Authentication failed while loading profile');
      } else if (response.status === 404) {
        console.log('User not found in database, attempting to sync user...');
        // Try to sync the user first
        const syncResponse = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (syncResponse.ok) {
          console.log('User synced successfully, retrying profile load...');
          // Retry loading profile after sync
          const retryResponse = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            const snapshot = normalizeProfileSnapshot(data.profileSnapshot, data.user?.email);
            const desiredRoles = Array.isArray(data.jobPreferences?.desiredRoles) ? data.jobPreferences.desiredRoles : [];
            const jobTypes = Array.isArray(data.jobPreferences?.jobType) ? data.jobPreferences.jobType : [];
            const industries = Array.isArray(data.jobPreferences?.industries) ? data.jobPreferences.industries : [];
            const salaryMin = typeof data.jobPreferences?.salaryMin === 'number' ? data.jobPreferences.salaryMin : undefined;

            const transformedProfile: ProfileFormData =
              snapshot ||
              ({
                firstName: data.profile?.firstName || '',
                lastName: data.profile?.lastName || '',
                email: data.user?.email || '',
                phone: data.profile?.phone || '',
                location: data.profile?.location || '',
                bio: data.profile?.bio || '',
                profilePhoto: undefined,
                education: [],
                workExperience: [],
                technicalSkills: [],
                softSkills: [],
                languages: [],
                projects: undefined,
                references: undefined,
                jobTitle: String(desiredRoles?.[0] || ''),
                industries,
                jobTypes,
                salaryExpectation: salaryMin,
                relocation: false,
                remotePreference: data.jobPreferences?.remoteWork ? 'Remote' : 'Flexible',
                careerGoals: '',
                template: 'Professional',
                colorScheme: '#2563eb',
                fontFamily: 'Arial',
                showPhoto: true,
                customSections: [],
              } as ProfileFormData);
            
            setProfile(transformedProfile);
            
            // Also update the profile data service
            profileDataService.setProfileData(transformedProfile);
          }
        }
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn, profile]);

  // Update profile (partial update)
  const updateProfile = useCallback(async (data: Partial<ProfileFormData>): Promise<boolean> => {
    if (!isLoaded || !isSignedIn) return false;

    setIsLoading(true);
    setError(null);

    try {
      let token = await getToken();
      
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }

      // Separate profile and job preferences
      const nextProfile = (profile ? { ...profile, ...data } : (data as ProfileFormData)) as ProfileFormData;
      setProfile(nextProfile);
      profileDataService.setProfileData(nextProfile);

      const { education, workExperience, technicalSkills, softSkills, languages, projects, references, template, colorScheme, fontFamily, showPhoto, customSections, jobTitle, industries, jobTypes, salaryExpectation, relocation, remotePreference, careerGoals, profilePhoto, email, ...profileData } = nextProfile;
      const jobPreferences = {
        desiredRoles: jobTitle ? [jobTitle] : [],
        industries: Array.isArray(industries) ? industries : [],
        jobType: Array.isArray(jobTypes) ? jobTypes : [],
        remoteWork: remotePreference === 'Remote',
        locations: nextProfile.location ? [nextProfile.location] : [],
        salaryMin: typeof salaryExpectation === 'number' ? salaryExpectation : undefined,
        salaryMax: undefined
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: profileData,
          jobPreferences,
          profileSnapshot: { ...nextProfile, profilePhoto: undefined }
        })
      });

      if (response.ok) {
        return true;
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  // Save complete profile
  const saveProfile = useCallback(async (data: Partial<ProfileFormData>): Promise<boolean> => {
    // Update the profile data service first (for immediate UI updates)
    profileDataService.setProfileData(data);
    
    return updateProfile(data);
  }, [updateProfile]);

  // Calculate completion percentage
  const completionPercentage = React.useMemo(() => {
    if (!profile) return 0;

    let completed = 0;
    let total = 0;

    // Personal info (6 fields)
    if (profile.firstName) completed++;
    if (profile.lastName) completed++;
    if (profile.email) completed++;
    if (profile.phone) completed++;
    if (profile.location) completed++;
    if (profile.bio) completed++;
    total += 6;

    // Education (3 fields per entry)
    profile.education?.forEach(edu => {
      if (edu.institution) completed++;
      if (edu.degree) completed++;
      if (edu.fieldOfStudy) completed++;
      total += 3;
    });

    // Work experience (3 fields per entry)
    profile.workExperience?.forEach(exp => {
      if (exp.company) completed++;
      if (exp.position) completed++;
      if (exp.description) completed++;
      total += 3;
    });

    // Skills (20% per skill, max 100%)
    const skillCount = (profile.technicalSkills?.length || 0) + 
                      (profile.softSkills?.length || 0) + 
                      (profile.languages?.length || 0);
    completed += Math.min(skillCount * 20, 100);
    total += 100;

    // Goals (4 fields)
    if (profile.jobTitle) completed++;
    if (profile.industries?.length) completed++;
    if (profile.remotePreference) completed++;
    if (profile.careerGoals) completed++;
    total += 4;

    // CV Style (1 field)
    if (profile.template) completed++;
    total += 1;

    return Math.round((completed / total) * 100);
  }, [profile]);

  const isProfileComplete = completionPercentage >= 80;

  // Get specific section
  const getProfileSection = useCallback(<K extends keyof ProfileFormData>(section: K): ProfileFormData[K] | null => {
    return profile?.[section] || null;
  }, [profile]);

  // Check if section exists
  const hasSection = useCallback(<K extends keyof ProfileFormData>(section: K): boolean => {
    const sectionData = profile?.[section];
    if (!sectionData) return false;
    
    if (Array.isArray(sectionData)) {
      return sectionData.length > 0;
    }
    
    return sectionData !== null && sectionData !== undefined;
  }, [profile]);

  // Load profile when user is authenticated with robust token validation
  useEffect(() => {
    const loadProfileData = async () => {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      // Add initial delay to let Clerk fully initialize
      await exponentialBackoff(0, 1000);

      // Validate token before making API calls
      const token = await getValidToken(getToken, 3);
      if (!token) {
        console.warn('Unable to get valid token, skipping profile load');
        return;
      }

      console.log('Token validated, loading profile data...');
      loadProfile();
    };

    loadProfileData();
  }, [isLoaded, isSignedIn, getToken, loadProfile]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setProfile(prev => prev ? { ...prev, ...event.detail } : null);
      }
    };

    window.addEventListener('profileDataUpdated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profileDataUpdated', handleProfileUpdate as EventListener);
  }, []);

  const value: ProfileContextType = {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    saveProfile,
    completionPercentage,
    isProfileComplete,
    personalInfo: getProfileSection('firstName') ? {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      profilePhoto: profile?.profilePhoto || null
    } : null,
    education: getProfileSection('education'),
    workExperience: getProfileSection('workExperience'),
    skills: getProfileSection('technicalSkills') ? {
      technicalSkills: profile?.technicalSkills || [],
      softSkills: profile?.softSkills || [],
      languages: profile?.languages || []
    } : null,
    goals: getProfileSection('jobTitle') ? {
      jobTitle: profile?.jobTitle || '',
      industries: profile?.industries || [],
      jobTypes: profile?.jobTypes || [],
      salaryExpectation: profile?.salaryExpectation,
      relocation: profile?.relocation || false,
      remotePreference: profile?.remotePreference || 'Flexible',
      careerGoals: profile?.careerGoals || ''
    } : null,
    cvStyle: getProfileSection('template') ? {
      template: profile?.template || 'Modern',
      colorScheme: profile?.colorScheme || '#2563eb',
      fontFamily: profile?.fontFamily || 'Arial',
      showPhoto: profile?.showPhoto !== false,
      customSections: profile?.customSections || []
    } : null,
    getProfileSection,
    hasSection
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
