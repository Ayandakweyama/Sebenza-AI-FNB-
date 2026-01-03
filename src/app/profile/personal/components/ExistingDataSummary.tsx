'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Target,
  Edit,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ProfileFormData } from '../profile.schema';

interface ExistingDataSummaryProps {
  data: Partial<ProfileFormData>;
  onEdit?: (section: string) => void;
}

export function ExistingDataSummary({ data, onEdit }: ExistingDataSummaryProps) {
  // Calculate completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    let total = 0;

    // Personal info (6 fields)
    if (data.firstName) completed++;
    if (data.lastName) completed++;
    if (data.email) completed++;
    if (data.phone) completed++;
    if (data.location) completed++;
    if (data.bio) completed++;
    total += 6;

    // Education (3 fields per entry)
    data.education?.forEach(edu => {
      if (edu.institution) completed++;
      if (edu.degree) completed++;
      if (edu.fieldOfStudy) completed++;
      total += 3;
    });

    // Work experience (3 fields per entry)
    data.workExperience?.forEach(exp => {
      if (exp.company) completed++;
      if (exp.position) completed++;
      if (exp.description) completed++;
      total += 3;
    });

    // Skills (20% per skill, max 100%)
    const skillCount = (data.technicalSkills?.length || 0) + 
                      (data.softSkills?.length || 0) + 
                      (data.languages?.length || 0);
    completed += Math.min(skillCount * 20, 100);
    total += 100;

    // Goals (4 fields)
    if (data.jobTitle) completed++;
    if (data.industries?.length) completed++;
    if (data.remotePreference) completed++;
    if (data.careerGoals) completed++;
    total += 4;

    // CV Style (1 field)
    if (data.template) completed++;
    total += 1;

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletion();

  const SectionStatus = ({ hasData, title, children }: { hasData: boolean; title: string; children: React.ReactNode }) => (
    <Card className={`transition-all duration-200 ${hasData ? 'bg-green-950/30 border-green-800' : 'bg-slate-800/30 border-slate-700'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {hasData ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-500" />
            )}
            {title}
          </span>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(title.toLowerCase())}
              className="h-6 w-6 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-blue-950/30 border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <User className="w-5 h-5" />
            Your Profile Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Completion</span>
              <span className="text-sm font-medium text-blue-400">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-slate-400">
              {completionPercentage >= 80 
                ? 'Your profile is almost complete!' 
                : completionPercentage >= 50 
                ? 'You\'re making good progress!'
                : 'Let\'s continue building your profile'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <SectionStatus 
        hasData={!!(data.firstName || data.lastName || data.email)} 
        title="Personal Information"
      >
        <div className="space-y-2">
          {data.firstName && data.lastName && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Name:</span> {data.firstName} {data.lastName}
            </p>
          )}
          {data.email && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Email:</span> {data.email}
            </p>
          )}
          {data.phone && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Phone:</span> {data.phone}
            </p>
          )}
          {data.location && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Location:</span> {data.location}
            </p>
          )}
          {data.bio && (
            <p className="text-sm text-slate-300 mt-2">
              <span className="text-slate-500">Bio:</span> {data.bio}
            </p>
          )}
        </div>
      </SectionStatus>

      {/* Education */}
      <SectionStatus 
        hasData={!!data.education?.length} 
        title="Education"
      >
        {data.education && data.education.length > 0 ? (
          <div className="space-y-2">
            {data.education.slice(0, 2).map((edu, index) => (
              <div key={index} className="text-sm text-slate-300">
                <p className="font-medium">{edu.degree}</p>
                <p className="text-slate-400">{edu.institution}</p>
                <p className="text-slate-500">{edu.fieldOfStudy}</p>
              </div>
            ))}
            {data.education.length > 2 && (
              <p className="text-xs text-slate-500">+{data.education.length - 2} more</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No education added yet</p>
        )}
      </SectionStatus>

      {/* Work Experience */}
      <SectionStatus 
        hasData={!!data.workExperience?.length} 
        title="Work Experience"
      >
        {data.workExperience && data.workExperience.length > 0 ? (
          <div className="space-y-2">
            {data.workExperience.slice(0, 2).map((exp, index) => (
              <div key={index} className="text-sm text-slate-300">
                <p className="font-medium">{exp.position}</p>
                <p className="text-slate-400">{exp.company}</p>
                {exp.description && (
                  <p className="text-slate-500 line-clamp-2">{exp.description}</p>
                )}
              </div>
            ))}
            {data.workExperience.length > 2 && (
              <p className="text-xs text-slate-500">+{data.workExperience.length - 2} more</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No experience added yet</p>
        )}
      </SectionStatus>

      {/* Skills */}
      <SectionStatus 
        hasData={!!(data.technicalSkills?.length || data.softSkills?.length || data.languages?.length)} 
        title="Skills"
      >
        <div className="space-y-3">
          {data.technicalSkills && data.technicalSkills.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Technical Skills</p>
              <div className="flex flex-wrap gap-1">
                {data.technicalSkills.slice(0, 5).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
                {data.technicalSkills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.technicalSkills.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {data.softSkills && data.softSkills.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Soft Skills</p>
              <div className="flex flex-wrap gap-1">
                {data.softSkills.slice(0, 5).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {data.softSkills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.softSkills.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {data.languages && data.languages.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Languages</p>
              <div className="flex flex-wrap gap-1">
                {data.languages.slice(0, 3).map((lang, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {lang.name}
                  </Badge>
                ))}
                {data.languages.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.languages.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {(!data.technicalSkills?.length && !data.softSkills?.length && !data.languages?.length) && (
            <p className="text-sm text-slate-500">No skills added yet</p>
          )}
        </div>
      </SectionStatus>

      {/* Career Goals */}
      <SectionStatus 
        hasData={!!(data.jobTitle || data.industries?.length)} 
        title="Career Goals"
      >
        <div className="space-y-2">
          {data.jobTitle && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Target Role:</span> {data.jobTitle}
            </p>
          )}
          {data.industries && data.industries.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Target Industries</p>
              <div className="flex flex-wrap gap-1">
                {data.industries.slice(0, 3).map((industry, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {industry}
                  </Badge>
                ))}
                {data.industries.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.industries.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          {data.remotePreference && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Work Preference:</span> {data.remotePreference}
            </p>
          )}
          {data.careerGoals && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Career Goals:</span> {data.careerGoals}
            </p>
          )}
        </div>
      </SectionStatus>

      {/* CV Style */}
      <SectionStatus 
        hasData={!!data.template} 
        title="CV Style"
      >
        <div className="space-y-2">
          {data.template && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Template:</span> {data.template}
            </p>
          )}
          {data.colorScheme && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Color:</span>
              <div 
                className="w-4 h-4 rounded border border-slate-600" 
                style={{ backgroundColor: data.colorScheme }}
              />
              <span className="text-xs text-slate-400">{data.colorScheme}</span>
            </div>
          )}
        </div>
      </SectionStatus>
    </div>
  );
}
