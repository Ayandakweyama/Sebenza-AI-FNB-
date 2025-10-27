'use client';

import React, { useState, useEffect } from 'react';
import CustomizableCVTemplate, { CVCustomizationOptions } from '../profile/personal/components/CustomizableCVTemplate';
import CVCustomizationPanel from '../profile/personal/components/CVCustomizationPanel';
import { ProfileFormData } from '../profile/personal/profile.schema';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  FileText, 
  Loader2, 
  Eye, 
  EyeOff, 
  Save,
  Edit3,
  User,
  Briefcase,
  GraduationCap,
  Code,
  ChevronRight
} from 'lucide-react';
import { exportToWord } from '../profile/personal/utils/cvExport';
import { toast } from 'sonner';

const CVBuilderPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    jobTitle: '',
    education: [],
    workExperience: [],
    technicalSkills: [],
    softSkills: []
  });
  
  // Customization state
  const [customization, setCustomization] = useState<CVCustomizationOptions>({
    layout: 'single-column',
    sidebarPosition: 'left',
    fontFamily: 'Arial, sans-serif',
    fontSize: 'medium',
    lineHeight: 'normal',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    accentColor: '#3b82f6',
    sectionOrder: ['summary', 'experience', 'education', 'skills'],
    visibleSections: {
      photo: false,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      languages: false,
      certifications: false,
      projects: false,
      references: false
    },
    sectionStyle: {
      headerStyle: 'underline',
      headerAlignment: 'left',
      headerCase: 'capitalize',
      spacing: 'normal'
    },
    dateFormat: 'Month YYYY',
    bulletStyle: 'disc',
    skillDisplay: 'tags',
    borderRadius: 'medium',
    shadow: 'medium',
    margins: 'normal'
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('cvBuilderData');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
    const savedCustomization = localStorage.getItem('cvBuilderCustomization');
    if (savedCustomization) {
      setCustomization(JSON.parse(savedCustomization));
    }
  }, []);

  // Save data to localStorage
  const saveData = () => {
    localStorage.setItem('cvBuilderData', JSON.stringify(formData));
    localStorage.setItem('cvBuilderCustomization', JSON.stringify(customization));
    toast.success('Progress saved!');
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filename = `${formData.firstName || 'CV'}_${formData.lastName || 'Resume'}_${Date.now()}`;
      
      const exportOptions = {
        filename: `${filename}.docx`,
        format: 'docx' as const,
        template: 'Professional' as const,
        colorScheme: customization.primaryColor,
        fontFamily: customization.fontFamily,
        showPhoto: customization.visibleSections.photo
      };

      await exportToWord(formData, exportOptions);
      toast.success('CV downloaded as Word document successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to download CV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const steps = [
    { id: 0, title: 'Personal Info', icon: <User className="h-5 w-5" /> },
    { id: 1, title: 'Experience', icon: <Briefcase className="h-5 w-5" /> },
    { id: 2, title: 'Education', icon: <GraduationCap className="h-5 w-5" /> },
    { id: 3, title: 'Skills', icon: <Code className="h-5 w-5" /> },
    { id: 4, title: 'Customize & Export', icon: <Edit3 className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-4">
            CV Builder
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto">
            Create a professional CV with our advanced customization tools. Design your perfect resume in minutes.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {step.icon}
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {currentStep < 4 ? (
          // Form Steps
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              {currentStep === 0 && (
                <PersonalInfoStep formData={formData} setFormData={setFormData} />
              )}
              {currentStep === 1 && (
                <ExperienceStep formData={formData} setFormData={setFormData} />
              )}
              {currentStep === 2 && (
                <EducationStep formData={formData} setFormData={setFormData} />
              )}
              {currentStep === 3 && (
                <SkillsStep formData={formData} setFormData={setFormData} />
              )}
              
              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
                <Button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <Button
                  onClick={saveData}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
                
                <Button
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Customization & Export Step
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Customization */}
            <div className="lg:col-span-1">
              <CVCustomizationPanel
                customization={customization}
                onCustomizationChange={setCustomization}
              />
              
              {/* Back Button */}
              <Button
                onClick={() => setCurrentStep(3)}
                variant="outline"
                className="w-full mt-4 border-slate-700 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Form
              </Button>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-2">
              {/* Export Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Export Options:</span>
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Download as Word Document
                  </Button>
                </div>
                
                <Button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  {isFullScreen ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                </Button>
              </div>

              {/* CV Preview */}
              <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900 p-8 overflow-auto' : 'border border-slate-700 rounded-lg overflow-hidden bg-slate-900 p-4'}`}>
                <div 
                  id="cv-preview-element"
                  className={`bg-white rounded shadow-sm overflow-auto ${isFullScreen ? 'max-w-4xl mx-auto' : 'max-h-[800px]'}`}
                  style={{
                    transform: isFullScreen ? 'scale(1)' : 'scale(0.8)',
                    transformOrigin: 'top center'
                  }}
                >
                  <CustomizableCVTemplate
                    data={formData}
                    customization={customization}
                  />
                </div>
                
                {/* Real-time Update Indicator */}
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live Preview - Updates in Real Time
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Form Step Components
function PersonalInfoStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
        <input
          type="text"
          value={formData.jobTitle || ''}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Professional Summary</label>
        <textarea
          value={formData.bio || ''}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
        />
      </div>
    </div>
  );
}

function ExperienceStep({ formData, setFormData }: any) {
  const addExperience = () => {
    const newExperience = {
      company: '',
      position: '',
      startDate: new Date(),
      endDate: undefined,
      current: false,
      description: '',
      achievements: []
    };
    setFormData({
      ...formData,
      workExperience: [...(formData.workExperience || []), newExperience]
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updatedExperience = [...(formData.workExperience || [])];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    };
    setFormData({ ...formData, workExperience: updatedExperience });
  };

  const removeExperience = (index: number) => {
    const updatedExperience = (formData.workExperience || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, workExperience: updatedExperience });
  };

  const addAchievement = (expIndex: number) => {
    const updatedExperience = [...(formData.workExperience || [])];
    updatedExperience[expIndex].achievements = [
      ...(updatedExperience[expIndex].achievements || []),
      ''
    ];
    setFormData({ ...formData, workExperience: updatedExperience });
  };

  const updateAchievement = (expIndex: number, achIndex: number, value: string) => {
    const updatedExperience = [...(formData.workExperience || [])];
    updatedExperience[expIndex].achievements[achIndex] = value;
    setFormData({ ...formData, workExperience: updatedExperience });
  };

  const removeAchievement = (expIndex: number, achIndex: number) => {
    const updatedExperience = [...(formData.workExperience || [])];
    updatedExperience[expIndex].achievements = updatedExperience[expIndex].achievements.filter(
      (_: any, i: number) => i !== achIndex
    );
    setFormData({ ...formData, workExperience: updatedExperience });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Work Experience</h2>
          <p className="text-slate-400">Add your work experience details</p>
        </div>
        <Button
          onClick={addExperience}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Add Position
        </Button>
      </div>

      {(!formData.workExperience || formData.workExperience.length === 0) ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-lg">
          <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No work experience added yet</p>
          <Button
            onClick={addExperience}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Add Your First Position
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {formData.workExperience.map((exp: any, index: number) => (
            <div key={index} className="border border-slate-700 rounded-lg p-6 bg-slate-800/30">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">Position {index + 1}</h3>
                <Button
                  onClick={() => removeExperience(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                  <input
                    type="text"
                    value={exp.company || ''}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                  <input
                    type="text"
                    value={exp.position || ''}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    placeholder="Job Title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                  <input
                    type="month"
                    value={exp.startDate ? new Date(exp.startDate).toISOString().slice(0, 7) : ''}
                    onChange={(e) => updateExperience(index, 'startDate', new Date(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input
                    type="month"
                    value={exp.endDate && !exp.current ? new Date(exp.endDate).toISOString().slice(0, 7) : ''}
                    onChange={(e) => updateExperience(index, 'endDate', new Date(e.target.value))}
                    disabled={exp.current}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.current || false}
                      onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
                    />
                    Current Position
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={exp.description || ''}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder="Describe your role and responsibilities..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Key Achievements</label>
                  <Button
                    onClick={() => addAchievement(index)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Add Achievement
                  </Button>
                </div>
                {exp.achievements && exp.achievements.map((achievement: string, achIndex: number) => (
                  <div key={achIndex} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                      placeholder="Describe an achievement..."
                    />
                    <Button
                      onClick={() => removeAchievement(index, achIndex)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EducationStep({ formData, setFormData }: any) {
  const addEducation = () => {
    const newEducation = {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: new Date(),
      endDate: undefined,
      current: false
    };
    setFormData({
      ...formData,
      education: [...(formData.education || []), newEducation]
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updatedEducation = [...(formData.education || [])];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    setFormData({ ...formData, education: updatedEducation });
  };

  const removeEducation = (index: number) => {
    const updatedEducation = (formData.education || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, education: updatedEducation });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Education</h2>
          <p className="text-slate-400">Add your educational background</p>
        </div>
        <Button
          onClick={addEducation}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800"
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>

      {(!formData.education || formData.education.length === 0) ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-lg">
          <GraduationCap className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No education added yet</p>
          <Button
            onClick={addEducation}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Add Your Education
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {formData.education.map((edu: any, index: number) => (
            <div key={index} className="border border-slate-700 rounded-lg p-6 bg-slate-800/30">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">Education {index + 1}</h3>
                <Button
                  onClick={() => removeEducation(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Institution</label>
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    placeholder="University/School Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Degree</label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    placeholder="e.g., Bachelor's, Master's"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Field of Study</label>
                <input
                  type="text"
                  value={edu.fieldOfStudy || ''}
                  onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., Computer Science, Business Administration"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                  <input
                    type="month"
                    value={edu.startDate ? new Date(edu.startDate).toISOString().slice(0, 7) : ''}
                    onChange={(e) => updateEducation(index, 'startDate', new Date(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input
                    type="month"
                    value={edu.endDate && !edu.current ? new Date(edu.endDate).toISOString().slice(0, 7) : ''}
                    onChange={(e) => updateEducation(index, 'endDate', new Date(e.target.value))}
                    disabled={edu.current}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edu.current || false}
                      onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
                    />
                    Currently Studying
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsStep({ formData, setFormData }: any) {
  // Technical Skills
  const addTechnicalSkill = () => {
    const newSkill = { name: '', level: 'Intermediate' };
    setFormData({
      ...formData,
      technicalSkills: [...(formData.technicalSkills || []), newSkill]
    });
  };

  const updateTechnicalSkill = (index: number, field: string, value: any) => {
    const updatedSkills = [...(formData.technicalSkills || [])];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value
    };
    setFormData({ ...formData, technicalSkills: updatedSkills });
  };

  const removeTechnicalSkill = (index: number) => {
    const updatedSkills = (formData.technicalSkills || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, technicalSkills: updatedSkills });
  };

  // Soft Skills
  const addSoftSkill = () => {
    setFormData({
      ...formData,
      softSkills: [...(formData.softSkills || []), '']
    });
  };

  const updateSoftSkill = (index: number, value: string) => {
    const updatedSkills = [...(formData.softSkills || [])];
    updatedSkills[index] = value;
    setFormData({ ...formData, softSkills: updatedSkills });
  };

  const removeSoftSkill = (index: number) => {
    const updatedSkills = (formData.softSkills || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, softSkills: updatedSkills });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Skills</h2>
        <p className="text-slate-400">Add your technical expertise and soft skills</p>
      </div>

      {/* Technical Skills Section */}
      <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Technical Skills</h3>
            <p className="text-sm text-slate-400">Programming languages, tools, and technologies</p>
          </div>
          <Button
            onClick={addTechnicalSkill}
            variant="outline"
            size="sm"
            className="border-slate-700 hover:bg-slate-800"
          >
            <Code className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>

        {(!formData.technicalSkills || formData.technicalSkills.length === 0) ? (
          <div className="text-center py-6 bg-slate-800/30 rounded-lg">
            <Code className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No technical skills added yet</p>
            <Button
              onClick={addTechnicalSkill}
              size="sm"
              className="mt-3 bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Skill
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.technicalSkills.map((skill: any, index: number) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={skill.name || ''}
                  onChange={(e) => updateTechnicalSkill(index, 'name', e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., JavaScript, Python, React"
                />
                <select
                  value={skill.level || 'Intermediate'}
                  onChange={(e) => updateTechnicalSkill(index, 'level', e.target.value)}
                  className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <Button
                  onClick={() => removeTechnicalSkill(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soft Skills Section */}
      <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Soft Skills</h3>
            <p className="text-sm text-slate-400">Personal and interpersonal skills</p>
          </div>
          <Button
            onClick={addSoftSkill}
            variant="outline"
            size="sm"
            className="border-slate-700 hover:bg-slate-800"
          >
            <User className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>

        {(!formData.softSkills || formData.softSkills.length === 0) ? (
          <div className="text-center py-6 bg-slate-800/30 rounded-lg">
            <User className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No soft skills added yet</p>
            <Button
              onClick={addSoftSkill}
              size="sm"
              className="mt-3 bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Skill
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.softSkills.map((skill: string, index: number) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={skill || ''}
                  onChange={(e) => updateSoftSkill(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., Leadership, Communication, Problem Solving"
                />
                <Button
                  onClick={() => removeSoftSkill(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Suggestions */}
      <div className="border border-slate-700 rounded-lg p-6 bg-slate-800/30">
        <h3 className="text-lg font-semibold text-white mb-3">Quick Add Suggestions</h3>
        
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">Popular Technical Skills:</p>
          <div className="flex flex-wrap gap-2">
            {['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS'].map((skill) => (
              <button
                key={skill}
                onClick={() => {
                  if (!formData.technicalSkills?.some((s: any) => s.name === skill)) {
                    addTechnicalSkill();
                    const lastIndex = formData.technicalSkills?.length || 0;
                    updateTechnicalSkill(lastIndex, 'name', skill);
                  }
                }}
                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-2">Popular Soft Skills:</p>
          <div className="flex flex-wrap gap-2">
            {['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Adaptability'].map((skill) => (
              <button
                key={skill}
                onClick={() => {
                  if (!formData.softSkills?.includes(skill)) {
                    setFormData({
                      ...formData,
                      softSkills: [...(formData.softSkills || []), skill]
                    });
                  }
                }}
                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CVBuilderPage;