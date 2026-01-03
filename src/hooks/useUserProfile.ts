'use client';

import { useProfile } from '@/contexts/ProfileContext';
import { ProfileFormData } from '@/app/profile/personal/profile.schema';

/**
 * Hook for accessing user profile data with convenience methods
 * This hook provides easy access to profile data throughout the app
 */
export function useUserProfile() {
  const profileContext = useProfile();

  // Get user's full name
  const fullName = profileContext.profile 
    ? `${profileContext.profile.firstName} ${profileContext.profile.lastName}`.trim()
    : '';

  // Get user's initials for avatars
  const initials = profileContext.profile
    ? `${profileContext.profile.firstName[0]}${profileContext.profile.lastName[0]}`.toUpperCase()
    : '';

  // Get user's primary email
  const email = profileContext.profile?.email || '';

  // Get user's location
  const location = profileContext.profile?.location || '';

  // Get user's bio
  const bio = profileContext.profile?.bio || '';

  // Get user's phone
  const phone = profileContext.profile?.phone || '';

  // Get job title/career goal
  const jobTitle = profileContext.profile?.jobTitle || '';

  // Get industries user is interested in
  const targetIndustries = profileContext.profile?.industries || [];

  // Get job types user is looking for
  const jobTypes = profileContext.profile?.jobTypes || [];

  // Get salary expectation
  const salaryExpectation = profileContext.profile?.salaryExpectation;

  // Get remote work preference
  const remotePreference = profileContext.profile?.remotePreference || 'Flexible';

  // Get technical skills
  const technicalSkills = profileContext.profile?.technicalSkills || [];

  // Get soft skills
  const softSkills = profileContext.profile?.softSkills || [];

  // Get languages
  const languages = profileContext.profile?.languages || [];

  // Get education
  const education = profileContext.profile?.education || [];

  // Get work experience
  const workExperience = profileContext.profile?.workExperience || [];

  // Get CV style preferences
  const cvStyle = profileContext.profile?.cvStyle || {
    template: 'Professional',
    colorScheme: '#2563eb',
    fontFamily: 'Arial',
    showPhoto: true
  };

  // Check if user has specific data
  const hasBasicInfo = !!(fullName && email);
  const hasEducation = education.length > 0;
  const hasWorkExperience = workExperience.length > 0;
  const hasSkills = technicalSkills.length > 0 || softSkills.length > 0;
  const hasGoals = !!(jobTitle && targetIndustries.length > 0);

  // Get formatted skills for display
  const allSkills = [
    ...technicalSkills.map(skill => skill.name),
    ...softSkills,
    ...languages.map(lang => `${lang.name} (${lang.proficiency})`)
  ];

  // Get most recent education
  const latestEducation = education.length > 0 
    ? education.reduce((latest, edu) => {
        const eduDate = edu.current ? new Date() : (edu.endDate || edu.startDate);
        const latestDate = latest.current ? new Date() : (latest.endDate || latest.startDate);
        return eduDate > latestDate ? edu : latest;
      })
    : null;

  // Get most recent work experience
  const latestWorkExperience = workExperience.length > 0
    ? workExperience.reduce((latest, exp) => {
        const expDate = exp.current ? new Date() : (exp.endDate || exp.startDate);
        const latestDate = latest.current ? new Date() : (latest.endDate || latest.startDate);
        return expDate > latestDate ? exp : latest;
      })
    : null;

  // Get experience level based on work experience
  const getExperienceLevel = (): string => {
    if (workExperience.length === 0) return 'Entry Level';
    
    const totalExperience = workExperience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    if (totalExperience < 1) return 'Entry Level';
    if (totalExperience < 3) return 'Junior';
    if (totalExperience < 5) return 'Mid-Level';
    if (totalExperience < 8) return 'Senior';
    return 'Lead/Principal';
  };

  // Format profile data for API calls
  const formatForAPI = (): Partial<ProfileFormData> => {
    if (!profileContext.profile) return {};
    
    return {
      firstName: profileContext.profile.firstName,
      lastName: profileContext.profile.lastName,
      email: profileContext.profile.email,
      phone: profileContext.profile.phone,
      location: profileContext.profile.location,
      bio: profileContext.profile.bio,
      jobTitle: profileContext.profile.jobTitle,
      industries: profileContext.profile.industries,
      jobTypes: profileContext.profile.jobTypes,
      salaryExpectation: profileContext.profile.salaryExpectation,
      relocation: profileContext.profile.relocation,
      remotePreference: profileContext.profile.remotePreference,
      careerGoals: profileContext.profile.careerGoals,
      technicalSkills: profileContext.profile.technicalSkills,
      softSkills: profileContext.profile.softSkills,
      languages: profileContext.profile.languages,
      education: profileContext.profile.education,
      workExperience: profileContext.profile.workExperience,
      template: profileContext.profile.template,
      colorScheme: profileContext.profile.colorScheme,
      fontFamily: profileContext.profile.fontFamily,
      showPhoto: profileContext.profile.showPhoto
    };
  };

  return {
    // Raw profile data
    ...profileContext,
    
    // Convenience properties
    fullName,
    initials,
    email,
    location,
    bio,
    phone,
    jobTitle,
    targetIndustries,
    jobTypes,
    salaryExpectation,
    remotePreference,
    technicalSkills,
    softSkills,
    languages,
    education,
    workExperience,
    cvStyle,
    allSkills,
    
    // Computed properties
    hasBasicInfo,
    hasEducation,
    hasWorkExperience,
    hasSkills,
    hasGoals,
    latestEducation,
    latestWorkExperience,
    experienceLevel: getExperienceLevel(),
    
    // Utility methods
    formatForAPI
  };
}
