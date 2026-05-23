'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import CustomizableCVTemplate, { CVCustomizationOptions } from '../profile/personal/components/CustomizableCVTemplate';
import CVCustomizationPanel from '../profile/personal/components/CVCustomizationPanel';
import { ProfileFormData } from '../profile/personal/profile.schema';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useAfrigter } from '@/hooks/useAfrigter';
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
  Lightbulb,
  Sparkles,
  Users,
  Folder,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const buildResumeText = (data: Partial<ProfileFormData>) => {
  const lines: string[] = [];

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  if (fullName) lines.push(fullName);
  if (data.jobTitle) lines.push(data.jobTitle);

  const contact = [data.email, data.phone, data.location].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);

  lines.push('');

  if (data.bio) {
    lines.push('SUMMARY');
    lines.push(data.bio);
    lines.push('');
  }

  if (data.workExperience?.length) {
    lines.push('EXPERIENCE');
    data.workExperience.forEach((exp) => {
      const header = [exp.position, exp.company].filter(Boolean).join(' - ');
      if (header) lines.push(header);
      if (exp.description) lines.push(exp.description);
      if (exp.achievements?.length) {
        exp.achievements.filter(Boolean).forEach((a) => lines.push(`- ${a}`));
      }
      lines.push('');
    });
  }

  if (data.education?.length) {
    lines.push('EDUCATION');
    data.education.forEach((edu) => {
      const header = [edu.degree, edu.fieldOfStudy ? `(${edu.fieldOfStudy})` : '', edu.institution]
        .filter(Boolean)
        .join(' ');
      if (header) lines.push(header);
    });
    lines.push('');
  }

  const coreSkills = data.technicalSkills?.map((s) => s.name).filter(Boolean) ?? [];
  const softSkills = data.softSkills?.filter(Boolean) ?? [];
  if (coreSkills.length || softSkills.length) {
    lines.push('SKILLS');
    if (coreSkills.length) lines.push(`Core: ${coreSkills.join(', ')}`);
    if (softSkills.length) lines.push(`Soft: ${softSkills.join(', ')}`);
    lines.push('');
  }

  if (data.references?.length) {
    lines.push('REFERENCES');
    data.references.forEach((ref) => {
      const meta = [ref.title, ref.company].filter(Boolean).join(' • ');
      lines.push([ref.name, meta].filter(Boolean).join(' - '));
      if (ref.relationship) lines.push(ref.relationship);
      const refContact = [ref.email, ref.phone].filter(Boolean).join(' | ');
      if (refContact) lines.push(refContact);
      if (ref.recommendation) lines.push(ref.recommendation);
      lines.push('');
    });
  }

  if (data.projects?.length) {
    lines.push('PROJECTS');
    data.projects.forEach((project) => {
      if (project.name) lines.push(project.name);
      if (project.technologies) lines.push(project.technologies);
      if (project.link) lines.push(project.link);
      if (project.description) lines.push(project.description);
      lines.push('');
    });
  }

  return lines.join('\n').trim();
};

const defaultCustomization: CVCustomizationOptions = {
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
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'references'],
  visibleSections: {
    photo: false,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    languages: false,
    certifications: false,
    projects: false,
    references: true
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
};

const CVBuilderPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('Entry-level');
  const [isGettingTips, setIsGettingTips] = useState(false);
  const [aiTipsByStep, setAiTipsByStep] = useState<Record<number, string>>({});
  const [aiTipsError, setAiTipsError] = useState<string | null>(null);

  const { provideResumeTips } = useAfrigter();
  
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
    softSkills: [],
    projects: [],
    references: []
  });
  
  // Customization state
  const [customization, setCustomization] = useState<CVCustomizationOptions>(defaultCustomization);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(0.8);
  const baseCvWidth = useMemo(() => 794, []);

  useEffect(() => {
    if (currentStep !== 6) return;
    if (typeof window === 'undefined') return;

    const updateScale = () => {
      const containerWidth = previewContainerRef.current?.clientWidth ?? 0;
      if (!containerWidth) return;
      const paddingBudget = isFullScreen ? 24 : 16;
      const next = (containerWidth - paddingBudget) / baseCvWidth;
      setPreviewScale(Math.max(0.45, Math.min(1, next)));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [baseCvWidth, currentStep, isFullScreen]);

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('cvBuilderData');
    const parsedSaved = savedData ? JSON.parse(savedData) : null;
    if (savedData) {
      setFormData((prev) => ({
        ...prev,
        ...parsedSaved,
        education: parsedSaved.education ?? prev.education,
        workExperience: parsedSaved.workExperience ?? prev.workExperience,
        technicalSkills: parsedSaved.technicalSkills ?? prev.technicalSkills,
        softSkills: parsedSaved.softSkills ?? prev.softSkills,
        references: parsedSaved.references ?? prev.references,
        projects: parsedSaved.projects ?? prev.projects
      }));
    }

    const shouldHydrateFromProfile =
      !parsedSaved ||
      (!parsedSaved.firstName &&
        !parsedSaved.lastName &&
        !parsedSaved.email &&
        !parsedSaved.phone &&
        !parsedSaved.location &&
        !parsedSaved.bio &&
        !parsedSaved.jobTitle &&
        !(parsedSaved.education && parsedSaved.education.length) &&
        !(parsedSaved.workExperience && parsedSaved.workExperience.length) &&
        !(parsedSaved.technicalSkills && parsedSaved.technicalSkills.length) &&
        !(parsedSaved.softSkills && parsedSaved.softSkills.length) &&
        !(parsedSaved.projects && parsedSaved.projects.length) &&
        !(parsedSaved.references && parsedSaved.references.length));

    if (shouldHydrateFromProfile) {
      void (async () => {
        try {
          const res = await fetch('/api/profile', { credentials: 'include' });
          if (!res.ok) return;
          const data = await res.json();
          const snapshot = data.profileSnapshot as Partial<ProfileFormData> | null;
          if (!snapshot) return;

          setFormData((prev) => ({
            ...prev,
            firstName: snapshot.firstName ?? prev.firstName,
            lastName: snapshot.lastName ?? prev.lastName,
            email: snapshot.email ?? prev.email,
            phone: snapshot.phone ?? prev.phone,
            location: snapshot.location ?? prev.location,
            bio: snapshot.bio ?? prev.bio,
            jobTitle: snapshot.jobTitle ?? prev.jobTitle,
            education: snapshot.education?.length ? snapshot.education : prev.education,
            workExperience: snapshot.workExperience?.length ? snapshot.workExperience : prev.workExperience,
            technicalSkills: snapshot.technicalSkills?.length ? snapshot.technicalSkills : prev.technicalSkills,
            softSkills: snapshot.softSkills?.length ? snapshot.softSkills : prev.softSkills
          }));
        } catch {}
      })();
    }

    const savedCustomization = localStorage.getItem('cvBuilderCustomization');
    if (savedCustomization) {
      const parsed = JSON.parse(savedCustomization);
      setCustomization((prev) => {
        const sectionOrder = parsed.sectionOrder?.length ? parsed.sectionOrder : prev.sectionOrder;
        const normalizedSectionOrder = sectionOrder.includes('projects')
          ? sectionOrder
          : (() => {
              const idx = sectionOrder.indexOf('references');
              const next = [...sectionOrder];
              next.splice(idx >= 0 ? idx : next.length, 0, 'projects');
              return next;
            })();

        return {
          ...prev,
          ...parsed,
          sectionOrder: normalizedSectionOrder,
          visibleSections: { ...prev.visibleSections, ...(parsed.visibleSections ?? {}) },
          sectionStyle: { ...prev.sectionStyle, ...(parsed.sectionStyle ?? {}) }
        };
      });
    }
  }, []);

  // Save data to localStorage
  const saveData = () => {
    localStorage.setItem('cvBuilderData', JSON.stringify(formData));
    localStorage.setItem('cvBuilderCustomization', JSON.stringify(customization));
    toast.success('Progress saved!');
  };

  const stepFocus: Record<number, string> = {
    0: 'Personal information and summary',
    1: 'Work experience and achievements',
    2: 'Education',
    3: 'Skills (core and soft skills)',
    4: 'Projects (optional portfolio highlights)',
    5: 'References and recommendations',
  };

  const handleGetTips = async () => {
    try {
      setAiTipsError(null);
      setIsGettingTips(true);

      const focus = stepFocus[currentStep] ?? 'Overall CV';
      const resumeTextRaw = buildResumeText(formData);
      const resumeText =
        resumeTextRaw ||
        `The user is building a CV. Provide practical, step-by-step CV writing tips for: ${focus}.`;

      const response = await provideResumeTips({
        resumeText,
        experienceLevel,
        jobDescription: `Focus area: ${focus}`,
      });

      if (response) {
        setAiTipsByStep((prev) => ({ ...prev, [currentStep]: response }));
        return;
      }

      setAiTipsError('Unable to generate tips right now. Please try again.');
    } catch (err) {
      setAiTipsError(err instanceof Error ? err.message : 'Unable to generate tips right now. Please try again.');
    } finally {
      setIsGettingTips(false);
    }
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
        showPhoto: customization.visibleSections.photo,
        customization
      };

      const { exportToWord } = await import('../profile/personal/utils/cvExport');
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
    { id: 3, title: 'Skills', icon: <Sparkles className="h-5 w-5" /> },
    { id: 4, title: 'Projects', icon: <Folder className="h-5 w-5" /> },
    { id: 5, title: 'References', icon: <Users className="h-5 w-5" /> },
    { id: 6, title: 'Customize & Export', icon: <Edit3 className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-3 sm:px-4 pt-20 pb-8">
        {/* Header */}
        <div className="text-center mb-7 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            CV Builder
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-3xl mx-auto">
            Create a professional CV with our advanced customization tools. Design your perfect resume in minutes.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full px-1 py-1">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
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
                  <ChevronRight className="hidden sm:block h-4 w-4 text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {currentStep < 6 ? (
          // Form Steps
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.06)]">
              <div className="mb-5 sm:mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-sm text-slate-400">Experience level for AI tips:</span>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  >
                    <option value="Student">Student</option>
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Career switcher">Career switcher</option>
                  </select>
                </div>

                <Button
                  onClick={handleGetTips}
                  disabled={isGettingTips}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
                >
                  {isGettingTips ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lightbulb className="h-4 w-4 mr-2" />
                  )}
                  Get AI Tips
                </Button>
              </div>

              {aiTipsError && (
                <div className="mb-6 border border-red-500/30 bg-red-500/10 rounded-lg p-4 text-sm text-red-200">
                  {aiTipsError}
                </div>
              )}

              {aiTipsByStep[currentStep] && (
                <div className="mb-6 border border-slate-700 bg-slate-800/30 rounded-lg p-4">
                  <MarkdownRenderer content={aiTipsByStep[currentStep]} />
                </div>
              )}

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
              {currentStep === 4 && (
                <ProjectsStep
                  formData={formData}
                  setFormData={setFormData}
                  customization={customization}
                  setCustomization={setCustomization}
                />
              )}
              {currentStep === 5 && (
                <ReferencesStep formData={formData} setFormData={setFormData} />
              )}
              
              {/* Navigation */}
              <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between sm:items-center">
                  <Button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-800 w-full"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <Button
                    onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    {currentStep === 5 ? 'Customize' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <Button
                  onClick={saveData}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800 w-full mt-3"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
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
                onClick={() => setCurrentStep(5)}
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
              <div
                ref={previewContainerRef}
                className={`${
                  isFullScreen
                    ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 overflow-auto'
                    : 'border border-slate-700 rounded-2xl overflow-hidden bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xl'
                }`}
              >
                <div 
                  id="cv-preview-element"
                  className={`bg-white rounded shadow-sm overflow-x-hidden overflow-y-auto ${isFullScreen ? 'max-w-4xl mx-auto' : 'max-h-[70vh] sm:max-h-[800px]'}`}
                  style={{
                    transform: `scale(${previewScale})`,
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
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
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
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
        <input
          type="text"
          value={formData.jobTitle || ''}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Professional Summary</label>
        <textarea
          value={formData.bio || ''}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Work Experience</h2>
          <p className="text-slate-400">Add your work experience details</p>
        </div>
        <Button
          onClick={addExperience}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Add Position
        </Button>
      </div>

      {(!formData.workExperience || formData.workExperience.length === 0) ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-2xl">
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
            <div key={index} className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-800/30">
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
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                  <input
                    type="text"
                    value={exp.position || ''}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
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
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input
                    type="month"
                    value={exp.endDate && !exp.current ? new Date(exp.endDate).toISOString().slice(0, 7) : ''}
                    onChange={(e) => updateExperience(index, 'endDate', new Date(e.target.value))}
                    disabled={exp.current}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base disabled:opacity-50"
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
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
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
                      className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Education</h2>
          <p className="text-slate-400">Add your educational background</p>
        </div>
        <Button
          onClick={addEducation}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>

      {(!formData.education || formData.education.length === 0) ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-2xl">
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
            <div key={index} className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-800/30">
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
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="University/School Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Degree</label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
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
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
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
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input
                    type="month"
                    value={edu.endDate && !edu.current ? new Date(edu.endDate).toISOString().slice(0, 7) : ''}
                    onChange={(e) => updateEducation(index, 'endDate', new Date(e.target.value))}
                    disabled={edu.current}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base disabled:opacity-50"
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
        <p className="text-slate-400">Add your job-specific skills and strengths</p>
      </div>

      {/* Technical Skills Section */}
      <div className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Core Skills</h3>
            <p className="text-sm text-slate-400">Tools, methods, and role-specific skills</p>
          </div>
          <Button
            onClick={addTechnicalSkill}
            variant="outline"
            size="sm"
            className="border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>

        {(!formData.technicalSkills || formData.technicalSkills.length === 0) ? (
          <div className="text-center py-6 bg-slate-800/30 rounded-2xl">
            <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No core skills added yet</p>
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
              <div key={index} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={skill.name || ''}
                  onChange={(e) => updateTechnicalSkill(index, 'name', e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  placeholder="e.g., Excel, Customer service, Cash handling, Inventory, Canva"
                />
                <select
                  value={skill.level || 'Intermediate'}
                  onChange={(e) => updateTechnicalSkill(index, 'level', e.target.value)}
                  className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base w-full sm:w-[170px]"
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
                  className="text-red-400 hover:text-red-300 self-end sm:self-auto"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soft Skills Section */}
      <div className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Soft Skills</h3>
            <p className="text-sm text-slate-400">Personal and interpersonal skills</p>
          </div>
          <Button
            onClick={addSoftSkill}
            variant="outline"
            size="sm"
            className="border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
          >
            <User className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>

        {(!formData.softSkills || formData.softSkills.length === 0) ? (
          <div className="text-center py-6 bg-slate-800/30 rounded-2xl">
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
              <div key={index} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={skill || ''}
                  onChange={(e) => updateSoftSkill(index, e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  placeholder="e.g., Leadership, Communication, Problem Solving"
                />
                <Button
                  onClick={() => removeSoftSkill(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 self-end sm:self-auto"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Suggestions */}
      <div className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-800/30">
        <h3 className="text-lg font-semibold text-white mb-3">Quick Add Suggestions</h3>
        
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">Popular Core Skills:</p>
          <div className="flex flex-wrap gap-2">
            {['Customer Service', 'Excel', 'Sales', 'Administration', 'POS Systems', 'Cash Handling', 'Project Coordination', 'Inventory Management', 'Canva'].map((skill) => (
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

function ProjectsStep({ formData, setFormData, customization, setCustomization }: any) {
  const addProject = () => {
    const newProject = {
      name: '',
      technologies: '',
      description: '',
      link: ''
    };

    setFormData({
      ...formData,
      projects: [...(formData.projects || []), newProject]
    });

    setCustomization({
      ...customization,
      sectionOrder: customization.sectionOrder.includes('projects')
        ? customization.sectionOrder
        : (() => {
            const idx = customization.sectionOrder.indexOf('references');
            const next = [...customization.sectionOrder];
            next.splice(idx >= 0 ? idx : next.length, 0, 'projects');
            return next;
          })(),
      visibleSections: { ...customization.visibleSections, projects: true }
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updatedProjects = [...(formData.projects || [])];
    updatedProjects[index] = {
      ...updatedProjects[index],
      [field]: value
    };
    setFormData({ ...formData, projects: updatedProjects });
  };

  const removeProject = (index: number) => {
    const updatedProjects = (formData.projects || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, projects: updatedProjects });
  };

  const toggleVisibility = (checked: boolean) => {
    setCustomization({
      ...customization,
      sectionOrder: customization.sectionOrder.includes('projects')
        ? customization.sectionOrder
        : (() => {
            const idx = customization.sectionOrder.indexOf('references');
            const next = [...customization.sectionOrder];
            next.splice(idx >= 0 ? idx : next.length, 0, 'projects');
            return next;
          })(),
      visibleSections: { ...customization.visibleSections, projects: checked }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects (Optional)</h2>
          <p className="text-slate-400">
            Add projects if they strengthen your CV. This section is optional for many industries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!customization?.visibleSections?.projects}
              onChange={(e) => toggleVisibility(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
            />
            Show on CV
          </label>
          <Button
            onClick={addProject}
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
          >
            <Folder className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {(!formData.projects || formData.projects.length === 0) ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-2xl">
          <Folder className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No projects added</p>
          <Button
            onClick={addProject}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {formData.projects.map((project: any, index: number) => (
            <div key={index} className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-800/30">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">Project {index + 1}</h3>
                <Button
                  onClick={() => removeProject(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={project.name || ''}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., Community Events Website"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tools / Skills Used (optional)</label>
                  <input
                    type="text"
                    value={project.technologies || ''}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., Excel, Canva, WordPress"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Link (optional)</label>
                <input
                  type="url"
                  value={project.link || ''}
                  onChange={(e) => updateProject(index, 'link', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
                <textarea
                  value={project.description || ''}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  placeholder="What was the project about and what did you achieve?"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReferencesStep({ formData, setFormData }: any) {
  const addReference = () => {
    const newReference = {
      name: '',
      relationship: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      recommendation: ''
    };

    setFormData({
      ...formData,
      references: [...(formData.references || []), newReference]
    });
  };

  const updateReference = (index: number, field: string, value: any) => {
    const updatedReferences = [...(formData.references || [])];
    updatedReferences[index] = {
      ...updatedReferences[index],
      [field]: value
    };
    setFormData({ ...formData, references: updatedReferences });
  };

  const removeReference = (index: number) => {
    const updatedReferences = (formData.references || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, references: updatedReferences });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">References</h2>
          <p className="text-slate-400">Add referees and optional recommendation quotes</p>
        </div>
        <Button
          onClick={addReference}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800 w-full sm:w-auto"
        >
          <Users className="h-4 w-4 mr-2" />
          Add Reference
        </Button>
      </div>

      {(!formData.references || formData.references.length === 0) ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-2xl">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No references added yet</p>
          <Button
            onClick={addReference}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Add Your First Reference
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {formData.references.map((ref: any, index: number) => (
            <div key={index} className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-800/30">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">Reference {index + 1}</h3>
                <Button
                  onClick={() => removeReference(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={ref.name || ''}
                    onChange={(e) => updateReference(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., Thandi Mokoena"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Relationship</label>
                  <input
                    type="text"
                    value={ref.relationship || ''}
                    onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., Manager / Supervisor / Lecturer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Job Title (optional)</label>
                  <input
                    type="text"
                    value={ref.title || ''}
                    onChange={(e) => updateReference(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., Store Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company (optional)</label>
                  <input
                    type="text"
                    value={ref.company || ''}
                    onChange={(e) => updateReference(index, 'company', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., FNB"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={ref.email || ''}
                    onChange={(e) => updateReference(index, 'email', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., thandi@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    value={ref.phone || ''}
                    onChange={(e) => updateReference(index, 'phone', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                    placeholder="e.g., +27 82 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Recommendation (optional)</label>
                <textarea
                  value={ref.recommendation || ''}
                  onChange={(e) => updateReference(index, 'recommendation', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-base"
                  placeholder="A short quote you want to include, or leave blank."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CVBuilderPage;
