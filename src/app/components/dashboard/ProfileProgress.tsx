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
    let mounted = true;

    const resolveProfileData = async () => {
      // Trigger a custom event to notify other components that profile data has been updated
      const profileUpdateEvent = new CustomEvent('profileDataUpdated');
      window.dispatchEvent(profileUpdateEvent);
      try {
        const savedData = localStorage.getItem('profileFormData');
        let formData = savedData ? JSON.parse(savedData) : null;

        if (!formData) {
          const response = await fetch('/api/profile', { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            if (data.profileSnapshot) {
              formData = data.profileSnapshot;
              localStorage.setItem('profileFormData', JSON.stringify(formData));
            }
          }
        }

        formData = formData || {};

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
            completed: !!(formData.template && formData.colorScheme && formData.fontFamily),
            progress: formData.template ? 100 : 0
          }
        ];

        if (!mounted) return;
        setProfileSteps(steps);
        
        // Calculate overall progress
        const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
        const avgProgress = Math.round(totalProgress / steps.length);
        setOverallProgress(avgProgress);
        
      } catch (error) {
        console.error('Error calculating profile progress:', error);
        if (!mounted) return;
        setProfileSteps([]);
        setOverallProgress(0);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    const trigger = () => {
      setIsLoading(true);
      void resolveProfileData();
    };

    trigger();

    window.addEventListener('profileDataUpdated', trigger);
    window.addEventListener('storage', trigger);
    window.addEventListener('focus', trigger);
    return () => {
      mounted = false;
      window.removeEventListener('profileDataUpdated', trigger);
      window.removeEventListener('storage', trigger);
      window.removeEventListener('focus', trigger);
    };
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
    if (progress >= 80) return 'text-emerald-300';
    if (progress >= 50) return 'text-amber-300';
    return 'text-rose-300';
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (isLoading) {
    return (
      <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_0_70px_rgba(168,85,247,0.10)] ${className}`}>
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-70 blur-xl pointer-events-none" />
        <div className="relative animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 shadow-[0_0_70px_rgba(168,85,247,0.10)] ${className}`}>
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-70 blur-xl pointer-events-none" />
      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Profile Completion</h3>
          <p className="text-slate-300/70 text-sm">Complete your profile to get better job matches.</p>
        </div>
        <div className="sm:text-right">
          <div className={`text-2xl font-bold ${getProgressColor(overallProgress)}`}>
            {overallProgress}%
          </div>
          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressBgColor(overallProgress)} transition-all duration-300`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative space-y-3 mb-6">
        {profileSteps.map((step) => (
          <div key={step.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl border border-white/10 ${step.completed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.04] text-slate-300/70'}`}>
                {step.completed ? <CheckCircle className="h-4 w-4" /> : step.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-white">{step.title}</h4>
                <p className="text-xs text-slate-300/60">{step.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className={`text-xs font-medium ${getProgressColor(step.progress)}`}>{step.progress}%</span>
              <div className="w-28 sm:w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
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
          className="w-full"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {overallProgress === 0 ? 'Start Building Profile' : 'Continue Profile'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}

      {overallProgress === 100 && (
        <div className="relative text-center p-4 rounded-2xl border border-white/10 bg-white/[0.04]">
          <CheckCircle className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
          <p className="text-emerald-300 font-medium">Profile Complete</p>
          <p className="text-slate-300/70 text-sm">Your profile is ready for job matching.</p>
        </div>
      )}
    </div>
  );
};
