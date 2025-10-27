'use client';

import { useState, useEffect } from 'react';
import { calculateProfileStrength, getProfileStrengthColor, getProfileStrengthLabel } from '@/lib/utils/profileStrength';
import { ProfileFormData } from '@/app/profile/personal/profile.schema';

interface ProfileStrengthData {
  percentage: number;
  label: string;
  color: string;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
}

export function useProfileStrength(): ProfileStrengthData {
  const [profileData, setProfileData] = useState<Partial<ProfileFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for localStorage changes and window focus to refresh data
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const debouncedRefresh = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1000); // Debounce for 1 second
    };

    const handleStorageChange = () => {
      debouncedRefresh();
    };

    const handleFocus = () => {
      debouncedRefresh();
    };

    const handleProfileUpdate = () => {
      debouncedRefresh();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('profileDataUpdated', handleProfileUpdate);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('profileDataUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        let finalProfileData: Partial<ProfileFormData> | null = null;

        // First, try to get data from localStorage (for recently saved data)
        const savedData = localStorage.getItem('profileFormData');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            // Using localStorage data (most up-to-date)
            finalProfileData = parsedData;
          } catch (e) {
            console.error('Error parsing saved profile data:', e);
          }
        }

        // If no localStorage data, fetch from API
        if (!finalProfileData) {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const data = await response.json();
          
            // Transform API data to match ProfileFormData structure
            const transformedData: Partial<ProfileFormData> = {
            firstName: data.profile?.firstName || '',
            lastName: data.profile?.lastName || '',
            email: data.user?.email || '',
            phone: data.profile?.phone || '',
            location: data.profile?.location || '',
            bio: data.profile?.bio || '',
            
            // Map job preferences
            jobTypes: data.jobPreferences?.desiredRoles || [],
            industries: data.jobPreferences?.industries || [],
            remotePreference: data.jobPreferences?.remoteWork ? 'Remote' : 'Flexible',
            
            // Map skills
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
                proficiency: s.proficiency === 'beginner' ? 'Conversational' :
                            s.proficiency === 'intermediate' ? 'Fluent' :
                            s.proficiency === 'expert' ? 'Native' : 'Conversational'
              })) || [],
            
            // Map education
            education: data.education?.map((edu: any) => ({
              institution: edu.institution,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              startDate: new Date(edu.startDate),
              endDate: edu.endDate ? new Date(edu.endDate) : undefined,
              current: edu.current || false,
              description: edu.description
            })) || [],
            
            // Map work experience
            workExperience: data.experience?.map((exp: any) => ({
              company: exp.company,
              position: exp.position,
              startDate: new Date(exp.startDate),
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
              current: exp.current || false,
              description: exp.description,
              achievements: exp.achievements || []
            })) || [],
            
            // CV Style preferences (may not be in API yet)
            template: data.cvStyle?.template || 'Professional',
            colorScheme: data.cvStyle?.colorScheme || '#2563eb',
            fontFamily: data.cvStyle?.fontFamily || 'Arial',
            showPhoto: data.cvStyle?.showPhoto !== false,
            
            // Additional fields from API
            jobTitle: data.jobPreferences?.jobTitle || '',
            salaryExpectation: data.jobPreferences?.salaryExpectation,
            relocation: data.jobPreferences?.relocation || false,
            careerGoals: data.jobPreferences?.careerGoals || ''
            };
            
            // Using API data as fallback
            finalProfileData = transformedData;
          }
        }

        // Set the final profile data
        setProfileData(finalProfileData);
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [refreshTrigger]);

  // Calculate profile strength
  const strengthData = calculateProfileStrength(profileData);
  const percentage = strengthData.percentage;
  const label = getProfileStrengthLabel(percentage);
  const color = getProfileStrengthColor(percentage);

  return {
    percentage,
    label,
    color,
    recommendations: strengthData.recommendations,
    isLoading,
    error
  };
}
