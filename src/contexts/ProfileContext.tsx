'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getValidToken, exponentialBackoff } from '@/utils/authHelpers';
import { ProfileFormData } from '@/app/profile/personal/profile.schema';
import { profileDataService } from '@/services/profileDataService';

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
    const serviceData = profileDataService.getProfileData();
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
        
        // Transform API data to match ProfileFormData structure
        const transformedProfile: ProfileFormData = {
          // Personal info
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          email: data.user?.email || '',
          phone: data.profile?.phone || '',
          location: data.profile?.location || '',
          bio: data.profile?.bio || '',
          profilePhoto: undefined,

          // Education
          education: data.education?.map((edu: any) => ({
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: new Date(edu.startDate),
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
            current: edu.current || false,
            description: edu.description
          })) || [],

          // Work experience
          workExperience: data.experience?.map((exp: any) => ({
            company: exp.company,
            position: exp.position,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            current: exp.current || false,
            description: exp.description,
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
          showPhoto: data.cvStyle?.showPhoto !== false,
          customSections: data.cvStyle?.customSections || []
        };

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
            
            // Transform API data to match ProfileFormData structure
            const transformedProfile: ProfileFormData = {
              // Personal info (flattened)
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone || '',
              location: data.location || '',
              bio: data.bio || '',
              profilePhoto: data.profilePhoto || null,
              
              // Education
              education: data.education || [{
                institution: '',
                degree: '',
                fieldOfStudy: '',
                startDate: new Date(),
                current: false,
                endDate: undefined,
                description: ''
              }],
              
              // Work Experience
              workExperience: data.workExperience || [{
                company: '',
                position: '',
                description: '',
                startDate: new Date(),
                endDate: undefined,
                current: false,
                achievements: []
              }],
              
              // Skills (flattened structure)
              technicalSkills: data.technicalSkills || [],
              softSkills: data.softSkills || [],
              languages: data.languages || [],

              // Goals & preferences (flattened structure)
              jobTitle: data.jobTitle || '',
              industries: data.industries || [],
              jobTypes: data.jobTypes || [],
              salaryExpectation: data.salaryExpectation,
              relocation: data.relocation || false,
              remotePreference: data.remotePreference || 'Flexible',
              careerGoals: data.careerGoals || '',
              
              // CV preferences (flattened structure)
              template: data.template || 'Modern',
              colorScheme: data.colorScheme || '#2563eb',
              fontFamily: data.fontFamily || 'Arial',
              showPhoto: data.showPhoto !== false,
              customSections: data.customSections || []
            };
            
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
  }, [getToken, isLoaded, isSignedIn]);

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
      const { education, workExperience, skills, jobTypes, industries, ...profileData } = data;
      const jobPreferences = {
        jobTitle: data.jobTitle,
        industries: data.industries,
        desiredRoles: data.jobTypes,
        salaryExpectation: data.salaryExpectation,
        relocation: data.relocation,
        remoteWork: data.remotePreference === 'Remote',
        careerGoals: data.careerGoals
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: profileData,
          jobPreferences
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state with new data
        setProfile(prev => prev ? { ...prev, ...data } : null);
        
        // Update the profile data service
        profileDataService.setProfileData(data);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('profileDataUpdated', { detail: data }));
        
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
