'use client';

import React from 'react';
import { ProfileFormData } from '@/app/profile/personal/profile.schema';

/**
 * Profile data service for centralized profile management
 * This service handles profile data persistence, retrieval, and synchronization
 */
class ProfileDataService {
  private static instance: ProfileDataService;
  private profileData: Partial<ProfileFormData> | null = null;
  private listeners: Set<(data: Partial<ProfileFormData> | null) => void> = new Set();

  private constructor() {}

  static getInstance(): ProfileDataService {
    if (!ProfileDataService.instance) {
      ProfileDataService.instance = new ProfileDataService();
    }
    return ProfileDataService.instance;
  }

  /**
   * Subscribe to profile data changes
   */
  subscribe(listener: (data: Partial<ProfileFormData> | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of profile data changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.profileData));
  }

  /**
   * Set profile data
   */
  setProfileData(data: Partial<ProfileFormData>): void {
    this.profileData = data;
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileFormData', JSON.stringify(data));
    }
    
    // Dispatch custom event for global listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profileDataUpdated', { detail: data }));
    }
    
    this.notifyListeners();
  }

  /**
   * Get profile data
   */
  getProfileData(): Partial<ProfileFormData> | null {
    return this.profileData;
  }

  /**
   * Load profile data from localStorage
   */
  loadFromStorage(): Partial<ProfileFormData> | null {
    if (typeof window === 'undefined') return null;

    try {
      const savedData = localStorage.getItem('profileFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.profileData = parsedData;
        return parsedData;
      }
    } catch (error) {
      console.error('Error loading profile data from storage:', error);
    }
    
    return null;
  }

  /**
   * Clear profile data
   */
  clearProfileData(): void {
    this.profileData = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profileFormData');
    }
    
    this.notifyListeners();
  }

  /**
   * Update specific profile section
   */
  updateSection<K extends keyof ProfileFormData>(
    section: K, 
    data: ProfileFormData[K]
  ): void {
    if (!this.profileData) {
      this.profileData = {};
    }
    
    this.profileData[section] = data;
    this.setProfileData(this.profileData);
  }

  /**
   * Get specific profile section
   */
  getSection<K extends keyof ProfileFormData>(section: K): ProfileFormData[K] | null {
    return this.profileData?.[section] || null;
  }

  /**
   * Check if profile section is complete
   */
  isSectionComplete<K extends keyof ProfileFormData>(section: K): boolean {
    const sectionData = this.getSection(section);
    
    if (!sectionData) return false;
    
    switch (section) {
      case 'personalInfo':
        const info = sectionData as any;
        return !!(info.firstName && info.lastName && info.email && info.phone && info.location);
      
      case 'education':
        const edu = sectionData as any[];
        return edu.length > 0 && edu.every(e => e.institution && e.degree && e.fieldOfStudy);
      
      case 'workExperience':
        const exp = sectionData as any[];
        return exp.length > 0 && exp.every(e => e.company && e.position);
      
      case 'skills':
        const skills = sectionData as any;
        return !!(skills.technicalSkills?.length || skills.softSkills?.length || skills.languages?.length);
      
      case 'goals':
        const goals = sectionData as any;
        return !!(goals.jobTitle && goals.industries?.length);
      
      case 'cvStyle':
        return !!(sectionData as any).template;
      
      default:
        return false;
    }
  }

  /**
   * Calculate profile completion percentage
   */
  getCompletionPercentage(): number {
    if (!this.profileData) return 0;

    let completed = 0;
    let total = 0;

    // Personal info (6 fields)
    if (this.profileData.firstName) completed++;
    if (this.profileData.lastName) completed++;
    if (this.profileData.email) completed++;
    if (this.profileData.phone) completed++;
    if (this.profileData.location) completed++;
    if (this.profileData.bio) completed++;
    total += 6;

    // Education (3 fields per entry)
    this.profileData.education?.forEach(edu => {
      if (edu.institution) completed++;
      if (edu.degree) completed++;
      if (edu.fieldOfStudy) completed++;
      total += 3;
    });

    // Work experience (3 fields per entry)
    this.profileData.workExperience?.forEach(exp => {
      if (exp.company) completed++;
      if (exp.position) completed++;
      if (exp.description) completed++;
      total += 3;
    });

    // Skills (20% per skill, max 100%)
    const skillCount = (this.profileData.technicalSkills?.length || 0) + 
                      (this.profileData.softSkills?.length || 0) + 
                      (this.profileData.languages?.length || 0);
    completed += Math.min(skillCount * 20, 100);
    total += 100;

    // Goals (4 fields)
    if (this.profileData.jobTitle) completed++;
    if (this.profileData.industries?.length) completed++;
    if (this.profileData.remotePreference) completed++;
    if (this.profileData.careerGoals) completed++;
    total += 4;

    // CV Style (1 field)
    if (this.profileData.template) completed++;
    total += 1;

    return Math.round((completed / total) * 100);
  }

  /**
   * Export profile data for API calls
   */
  exportForAPI(): Partial<ProfileFormData> {
    return this.profileData || {};
  }

  /**
   * Import profile data from API response
   */
  importFromAPI(data: any): void {
    const transformedProfile: Partial<ProfileFormData> = {
      firstName: data.profile?.firstName || '',
      lastName: data.profile?.lastName || '',
      email: data.user?.email || '',
      phone: data.profile?.phone || '',
      location: data.profile?.location || '',
      bio: data.profile?.bio || '',

      education: data.education?.map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
        current: edu.current || false,
        description: edu.description
      })) || [],

      workExperience: data.experience?.map((exp: any) => ({
        company: exp.company,
        position: exp.position,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        current: exp.current || false,
        description: exp.description,
        achievements: exp.achievements || []
      })) || [],

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

      jobTitle: data.jobPreferences?.jobTitle || '',
      industries: data.jobPreferences?.industries || [],
      jobTypes: data.jobPreferences?.desiredRoles || [],
      salaryExpectation: data.jobPreferences?.salaryExpectation,
      relocation: data.jobPreferences?.relocation || false,
      remotePreference: data.jobPreferences?.remoteWork ? 'Remote' : 'Flexible',
      careerGoals: data.jobPreferences?.careerGoals || '',

      template: data.cvStyle?.template || 'Professional',
      colorScheme: data.cvStyle?.colorScheme || '#2563eb',
      fontFamily: data.cvStyle?.fontFamily || 'Arial',
      showPhoto: data.cvStyle?.showPhoto !== false
    };

    this.setProfileData(transformedProfile);
  }
}

// Export singleton instance
export const profileDataService = ProfileDataService.getInstance();

// Export hook for easy React integration
export function useProfileDataService() {
  const [profileData, setProfileData] = React.useState<Partial<ProfileFormData> | null>(
    profileDataService.getProfileData()
  );

  React.useEffect(() => {
    // Load from storage on mount
    const storedData = profileDataService.loadFromStorage();
    if (storedData) {
      setProfileData(storedData);
    }

    // Subscribe to changes
    const unsubscribe = profileDataService.subscribe(setProfileData);
    
    return unsubscribe;
  }, []);

  return {
    profileData,
    setProfileData: profileDataService.setProfileData.bind(profileDataService),
    updateSection: profileDataService.updateSection.bind(profileDataService),
    getSection: profileDataService.getSection.bind(profileDataService),
    isSectionComplete: profileDataService.isSectionComplete.bind(profileDataService),
    getCompletionPercentage: profileDataService.getCompletionPercentage.bind(profileDataService),
    exportForAPI: profileDataService.exportForAPI.bind(profileDataService),
    importFromAPI: profileDataService.importFromAPI.bind(profileDataService),
    clearProfileData: profileDataService.clearProfileData.bind(profileDataService)
  };
}
