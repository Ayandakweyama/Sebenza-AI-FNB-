import { ProfileFormData } from '@/app/profile/personal/profile.schema';

interface ProfileStrengthBreakdown {
  totalScore: number;
  maxScore: number;
  percentage: number;
  sections: {
    personalInfo: { score: number; max: number; missing: string[] };
    education: { score: number; max: number; missing: string[] };
    experience: { score: number; max: number; missing: string[] };
    skills: { score: number; max: number; missing: string[] };
    goals: { score: number; max: number; missing: string[] };
    cvStyle: { score: number; max: number; missing: string[] };
  };
  recommendations: string[];
}

export function calculateProfileStrength(profileData: Partial<ProfileFormData> | null): ProfileStrengthBreakdown {
  const breakdown: ProfileStrengthBreakdown = {
    totalScore: 0,
    maxScore: 100,
    percentage: 0,
    sections: {
      personalInfo: { score: 0, max: 20, missing: [] },
      education: { score: 0, max: 15, missing: [] },
      experience: { score: 0, max: 20, missing: [] },
      skills: { score: 0, max: 20, missing: [] },
      goals: { score: 0, max: 15, missing: [] },
      cvStyle: { score: 0, max: 10, missing: [] },
    },
    recommendations: [],
  };

  if (!profileData) {
    breakdown.recommendations.push('Complete your profile to unlock all features');
    return breakdown;
  }

  // Personal Information (20 points)
  const personalSection = breakdown.sections.personalInfo;
  if (profileData.firstName && profileData.firstName.trim()) personalSection.score += 4;
  else personalSection.missing.push('First name');
  
  if (profileData.lastName && profileData.lastName.trim()) personalSection.score += 4;
  else personalSection.missing.push('Last name');
  
  if (profileData.email && profileData.email.trim()) personalSection.score += 3;
  else personalSection.missing.push('Email');
  
  if (profileData.phone && profileData.phone.trim()) personalSection.score += 3;
  else personalSection.missing.push('Phone number');
  
  if (profileData.location && profileData.location.trim()) personalSection.score += 3;
  else personalSection.missing.push('Location');
  
  if (profileData.bio && profileData.bio.trim().length >= 50) personalSection.score += 3;
  else if (profileData.bio && profileData.bio.trim().length > 0) personalSection.score += 1;
  else personalSection.missing.push('Bio (at least 50 characters)');

  // Education (15 points)
  const educationSection = breakdown.sections.education;
  if (profileData.education && profileData.education.length > 0) {
    const validEducation = profileData.education.filter(edu => 
      edu.institution && edu.degree && edu.fieldOfStudy
    );
    
    if (validEducation.length > 0) {
      educationSection.score += 10; // Base score for having at least one education
      
      // Additional points for completeness
      validEducation.forEach(edu => {
        if (edu.description && edu.description.trim()) educationSection.score += 2;
      });
      
      // Cap at max score
      educationSection.score = Math.min(educationSection.score, educationSection.max);
    } else {
      educationSection.missing.push('Complete at least one education entry');
    }
  } else {
    educationSection.missing.push('Add your education');
  }

  // Work Experience (20 points)
  const experienceSection = breakdown.sections.experience;
  if (profileData.workExperience && profileData.workExperience.length > 0) {
    const validExperience = profileData.workExperience.filter(exp => 
      exp.company && exp.position
    );
    
    if (validExperience.length > 0) {
      experienceSection.score += 10; // Base score
      
      validExperience.forEach(exp => {
        if (exp.description && exp.description.trim()) experienceSection.score += 3;
        if (exp.achievements && exp.achievements.length > 0) experienceSection.score += 2;
      });
      
      experienceSection.score = Math.min(experienceSection.score, experienceSection.max);
    } else {
      experienceSection.missing.push('Complete at least one work experience');
    }
  } else {
    experienceSection.missing.push('Add your work experience');
  }

  // Skills (20 points)
  const skillsSection = breakdown.sections.skills;
  
  // Technical skills (8 points)
  if (profileData.technicalSkills && profileData.technicalSkills.length > 0) {
    const validTechnicalSkills = profileData.technicalSkills.filter(skill => 
      skill.name && skill.name.trim()
    );
    
    if (validTechnicalSkills.length >= 3) skillsSection.score += 8;
    else if (validTechnicalSkills.length >= 1) skillsSection.score += 4;
    else skillsSection.missing.push('Add at least 3 technical skills');
  } else {
    skillsSection.missing.push('Add technical skills');
  }

  // Soft skills (6 points)
  if (profileData.softSkills && profileData.softSkills.length > 0) {
    const validSoftSkills = profileData.softSkills.filter(skill => skill && skill.trim());
    
    if (validSoftSkills.length >= 3) skillsSection.score += 6;
    else if (validSoftSkills.length >= 1) skillsSection.score += 3;
    else skillsSection.missing.push('Add at least 3 soft skills');
  } else {
    skillsSection.missing.push('Add soft skills');
  }

  // Languages (6 points)
  if (profileData.languages && profileData.languages.length > 0) {
    const validLanguages = profileData.languages.filter(lang => 
      lang.name && lang.name.trim()
    );
    
    if (validLanguages.length >= 1) skillsSection.score += 6;
  } else {
    skillsSection.missing.push('Add at least one language');
  }

  // Goals & Preferences (15 points)
  const goalsSection = breakdown.sections.goals;
  
  if (profileData.jobTitle && profileData.jobTitle.trim()) goalsSection.score += 3;
  else goalsSection.missing.push('Desired job title');
  
  if (profileData.industries && profileData.industries.length > 0) goalsSection.score += 3;
  else goalsSection.missing.push('Preferred industries');
  
  if (profileData.jobTypes && profileData.jobTypes.length > 0) goalsSection.score += 3;
  else goalsSection.missing.push('Job type preferences');
  
  if (profileData.remotePreference) goalsSection.score += 2;
  else goalsSection.missing.push('Remote work preference');
  
  if (profileData.careerGoals && profileData.careerGoals.trim().length >= 50) goalsSection.score += 4;
  else if (profileData.careerGoals && profileData.careerGoals.trim()) goalsSection.score += 2;
  else goalsSection.missing.push('Career goals description');

  // CV Style (10 points)
  const cvSection = breakdown.sections.cvStyle;
  
  if (profileData.template) cvSection.score += 4;
  else cvSection.missing.push('CV template selection');
  
  if (profileData.colorScheme) cvSection.score += 2;
  else cvSection.missing.push('Color scheme');
  
  if (profileData.fontFamily) cvSection.score += 2;
  else cvSection.missing.push('Font selection');
  
  if (profileData.showPhoto !== undefined) cvSection.score += 2;

  // Calculate totals
  Object.values(breakdown.sections).forEach(section => {
    breakdown.totalScore += section.score;
  });

  breakdown.percentage = Math.round((breakdown.totalScore / breakdown.maxScore) * 100);

  // Generate recommendations based on missing items
  const allMissing: string[] = [];
  Object.entries(breakdown.sections).forEach(([sectionName, section]) => {
    if (section.missing.length > 0) {
      allMissing.push(...section.missing);
    }
  });

  // Prioritize recommendations
  if (breakdown.percentage < 30) {
    breakdown.recommendations.push('Start by completing your personal information');
  } else if (breakdown.percentage < 50) {
    breakdown.recommendations.push('Add your education and work experience');
  } else if (breakdown.percentage < 70) {
    breakdown.recommendations.push('Enhance your profile with skills and career goals');
  } else if (breakdown.percentage < 90) {
    breakdown.recommendations.push('Complete remaining sections for a perfect profile');
  } else if (breakdown.percentage < 100) {
    breakdown.recommendations.push('Almost there! Fill in the last few details');
  } else {
    breakdown.recommendations.push('Excellent! Your profile is complete');
  }

  // Add specific missing items (up to 3)
  if (allMissing.length > 0) {
    const topMissing = allMissing.slice(0, 3);
    topMissing.forEach(item => {
      breakdown.recommendations.push(`Add your ${item.toLowerCase()}`);
    });
  }

  return breakdown;
}

// Helper function to get profile strength color
export function getProfileStrengthColor(percentage: number): string {
  if (percentage >= 90) return 'from-green-500 to-emerald-500';
  if (percentage >= 70) return 'from-blue-500 to-cyan-500';
  if (percentage >= 50) return 'from-yellow-500 to-orange-500';
  if (percentage >= 30) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-pink-500';
}

// Helper function to get profile strength label
export function getProfileStrengthLabel(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Fair';
  if (percentage >= 30) return 'Needs Work';
  return 'Just Started';
}
