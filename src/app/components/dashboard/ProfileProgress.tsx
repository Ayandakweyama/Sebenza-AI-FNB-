'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Code, 
  Target, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  progress: number;
}

interface ProfileProgressProps {
  className?: string;
}

export const ProfileProgress: React.FC<ProfileProgressProps> = ({ className = '' }) => {
  const router = useRouter();
  const [profileSteps, setProfileSteps] = useState<ProfileStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate profile completion based on saved data
  useEffect(() => {
    const calculateProgress = () => {
      // Trigger a custom event to notify other components that profile data has been updated
      const profileUpdateEvent = new CustomEvent('profileDataUpdated');
      window.dispatchEvent(profileUpdateEvent);
      try {
        // Get saved form data from localStorage
        const savedData = localStorage.getItem('profileFormData');
        const formData = savedData ? JSON.parse(savedData) : {};

        const steps: ProfileStep[] = [
          {
            id: 'personal',
            title: 'Personal Information',
            description: 'Basic details and contact info',
            icon: <User className="h-5 w-5" />,
            completed: !!(formData.firstName && formData.lastName && formData.email),
            progress: calculateStepProgress([
              formData.firstName,
              formData.lastName, 
              formData.email,
              formData.phone,
              formData.location,
              formData.bio
            ])
          },
          {
            id: 'education',
            title: 'Education',
            description: 'Academic background and qualifications',
            icon: <GraduationCap className="h-5 w-5" />,
            completed: !!(formData.education && formData.education.length > 0 && formData.education[0].institution),
            progress: calculateEducationProgress(formData.education)
          },
          {
            id: 'experience',
            title: 'Work Experience',
            description: 'Professional background and achievements',
            icon: <Briefcase className="h-5 w-5" />,
            completed: !!(formData.workExperience && formData.workExperience.length > 0 && formData.workExperience[0].company),
            progress: calculateExperienceProgress(formData.workExperience)
          },
          {
            id: 'skills',
            title: 'Skills & Languages',
            description: 'Technical and soft skills',
            icon: <Code className="h-5 w-5" />,
            completed: !!(
              (formData.technicalSkills && formData.technicalSkills.some((s: any) => s.name)) ||
              (formData.softSkills && formData.softSkills.length > 0)
            ),
            progress: calculateSkillsProgress(formData)
          },
          {
            id: 'goals',
            title: 'Career Goals',
            description: 'Job preferences and career objectives',
            icon: <Target className="h-5 w-5" />,
            completed: !!(formData.jobTitle && formData.industries && formData.industries.length > 0),
            progress: calculateGoalsProgress(formData)
          },
          {
            id: 'cv',
            title: 'CV Design',
            description: 'Customize and finalize your CV',
            icon: <FileText className="h-5 w-5" />,
            completed: !!(localStorage.getItem('cvCustomization')),
            progress: localStorage.getItem('cvCustomization') ? 100 : 0
          }
        ];

        setProfileSteps(steps);
        
        // Calculate overall progress
        const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
        const avgProgress = Math.round(totalProgress / steps.length);
        setOverallProgress(avgProgress);
        
      } catch (error) {
        console.error('Error calculating profile progress:', error);
        setProfileSteps([]);
        setOverallProgress(0);
      } finally {
        setIsLoading(false);
      }
    };

    calculateProgress();
  }, []);

  const calculateStepProgress = (fields: any[]): number => {
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const calculateEducationProgress = (education: any[]): number => {
    if (!education || education.length === 0) return 0;
    const firstEd = education[0];
    const fields = [firstEd.institution, firstEd.degree, firstEd.fieldOfStudy];
    return calculateStepProgress(fields);
  };

  const calculateExperienceProgress = (experience: any[]): number => {
    if (!experience || experience.length === 0) return 0;
    const firstExp = experience[0];
    const fields = [firstExp.company, firstExp.position, firstExp.description];
    return calculateStepProgress(fields);
  };

  const calculateSkillsProgress = (formData: any): number => {
    const techSkills = formData.technicalSkills?.filter((s: any) => s.name) || [];
    const softSkills = formData.softSkills || [];
    const languages = formData.languages?.filter((l: any) => l.name) || [];
    
    const totalSkills = techSkills.length + softSkills.length + languages.length;
    return totalSkills > 0 ? Math.min(100, totalSkills * 20) : 0; // 20% per skill, max 100%
  };

  const calculateGoalsProgress = (formData: any): number => {
    const fields = [
      formData.jobTitle,
      formData.industries?.length > 0,
      formData.remotePreference,
      formData.careerGoals
    ];
    return calculateStepProgress(fields);
  };

  const handleContinueProfile = () => {
    router.push('/profile/personal');
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-400';
    if (progress >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-xl p-6 border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Profile Completion</h3>
          <p className="text-slate-400 text-sm">Complete your profile to get better job matches</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getProgressColor(overallProgress)}`}>
            {overallProgress}%
          </div>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressBgColor(overallProgress)} transition-all duration-300`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3 mb-6">
        {profileSteps.map((step) => (
          <div key={step.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${step.completed ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                {step.completed ? <CheckCircle className="h-4 w-4" /> : step.icon}
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">{step.title}</h4>
                <p className="text-xs text-slate-400">{step.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${getProgressColor(step.progress)}`}>
                {step.progress}%
              </span>
              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressBgColor(step.progress)} transition-all duration-300`}
                  style={{ width: `${step.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {overallProgress < 100 && (
        <Button
          onClick={handleContinueProfile}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {overallProgress === 0 ? 'Start Building Profile' : 'Continue Profile'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}

      {overallProgress === 100 && (
        <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium">Profile Complete!</p>
          <p className="text-green-300/80 text-sm">Your profile is ready for job matching</p>
        </div>
      )}
    </div>
  );
};
