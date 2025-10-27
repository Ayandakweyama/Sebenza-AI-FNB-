"use client";

import React from "react";
import { CVTemplate } from "../../profile/personal/components/CVTemplate";

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
}

interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

interface CVPreviewProps {
  formData: FormData;
  selectedTemplate: string;
}

const CVPreview: React.FC<CVPreviewProps> = ({ formData, selectedTemplate }) => {
  // Convert form data to the format expected by CVTemplate
  const templateData = {
    firstName: formData.personalInfo.name.split(' ')[0] || '',
    lastName: formData.personalInfo.name.split(' ').slice(1).join(' ') || '',
    email: formData.personalInfo.email,
    phone: formData.personalInfo.phone,
    location: formData.personalInfo.location,
    bio: formData.personalInfo.summary,
    education: formData.education.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: 'Field of Study', // Default since not in form
      startDate: new Date(), // Default since not in form
      endDate: undefined,
      current: false
    })),
    workExperience: formData.experience.map(exp => ({
      company: exp.company,
      position: exp.position,
      startDate: new Date(), // Default since not in form
      current: false,
      description: exp.description,
      achievements: []
    })),
    technicalSkills: formData.skills.map(skill => ({
      name: skill,
      level: 'Intermediate' as const
    })),
    softSkills: [],
    jobTitle: '',
    industries: [],
    remotePreference: 'Flexible' as const,
    careerGoals: '',
    template: selectedTemplate,
    colorScheme: '#2563eb',
    fontFamily: 'Arial',
    showPhoto: false
  };

  // Map template names to match CVTemplate component
  const templateMap: { [key: string]: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive' } = {
    'professional': 'Professional',
    'modern': 'Modern',
    'creative': 'Creative',
    'minimal': 'Minimalist',
    'executive': 'Executive'
  };

  const mappedTemplate = templateMap[selectedTemplate] || 'Professional';

  return (
    <div className="h-[800px] overflow-y-auto bg-gray-100">
      <CVTemplate
        data={templateData}
        template={mappedTemplate}
        colorScheme="#2563eb"
        fontFamily="Arial"
        showPhoto={false}
      />
    </div>
  );
};

export default CVPreview;
