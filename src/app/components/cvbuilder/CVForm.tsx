import React, { useState, Dispatch, SetStateAction } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Eye,
  Download,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Briefcase,
  Star,
  GraduationCap,
  Award
} from 'lucide-react';

// Import UI components
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Badge } from "@/app/components/ui/badge"
import { HTMLAttributes } from "react";

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
  location: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
  location: string;
  honors: string;
}

export interface Project {
  name: string;
  technologies: string;
  description: string;
  link: string;
}

export interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

interface CVFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

// Helper type for form sections
type FormSection = 'personalInfo' | 'experience' | 'education' | 'projects';

// Helper type for form fields
type FormField = keyof PersonalInfo | keyof Experience | keyof Education | keyof Project;

// CVSection Component
const CVSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; collapsible?: boolean }> = ({ 
  title, 
  icon: Icon, 
  children, 
  collapsible = false 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6 shadow-2xl">
      <div 
        className={`flex items-center gap-3 mb-6 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="p-2 bg-gradient-to-r from-purple-500 to-yellow-400 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {collapsible && (
          <div className={`ml-auto transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}>
            <Plus className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
      {!isCollapsed && children}
    </div>
  );
};

// Skill Badge Component
const SkillBadge: React.FC<{ skill: string; onRemove: () => void }> = ({ skill, onRemove }) => (
  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-yellow-400/20 border border-purple-400/30 rounded-full px-3 py-1 text-sm text-white">
    <span>{skill}</span>
    <button onClick={onRemove} className="hover:text-red-400 transition-colors">
      <Trash2 className="w-3 h-3" />
    </button>
  </div>
);

const CVForm: React.FC<CVFormProps> = ({ formData, setFormData }) => {
  const [newSkill, setNewSkill] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Helper function to update form data
  const updateFormData = <K extends keyof FormData>(
    section: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: value
    }));
  };
  
  // Helper to update nested fields
  const updateNestedField = <
    T extends keyof FormData,
    K extends keyof FormData[T],
    V extends FormData[T][K]
  >(
    section: T,
    field: K,
    value: V
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  // Helper to update array items
  const updateArrayItem = <T extends 'experience' | 'education' | 'projects'>(
    section: T,
    index: number,
    field: keyof FormData[T][number],
    value: any
  ) => {
    setFormData(prev => {
      const newArray = [...prev[section]];
      (newArray[index] as any)[field] = value;
      return {
        ...prev,
        [section]: newArray
      };
    });
  };

  // Experience handlers
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          company: '',
          position: '',
          duration: '',
          description: '',
          location: '',
          achievements: ['']
        }
      ]
    }));
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', duration: '', description: '', location: '', achievements: [''] }]
    }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addAchievement = (expIndex: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === expIndex ? { ...exp, achievements: [...(exp.achievements || []), ''] } : exp
      )
    }));
  };

  const updateAchievement = (expIndex: number, achievementIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === expIndex ? {
          ...exp,
          achievements: exp.achievements?.map((ach, j) => j === achievementIndex ? value : ach) || []
        } : exp
      )
    }));
  };

  const removeAchievement = (expIndex: number, achievementIndex: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === expIndex ? {
          ...exp,
          achievements: exp.achievements?.filter((_, j) => j !== achievementIndex) || []
        } : exp
      )
    }));
  };

  // Education handlers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', duration: '', gpa: '', location: '', honors: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Project handlers
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { name: '', technologies: '', description: '', link: '' }]
    }));
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) => 
        i === index ? { ...proj, [field]: value } : proj
      )
    }));
  };

  // Skills handlers
  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Save functionality
  const handleSave = async () => {
    setSaveStatus('saving');
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const inputClass = "bg-slate-700/50 border border-purple-400/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 hover:border-purple-400/50";
  const buttonClass = "bg-gradient-to-r from-purple-500 to-yellow-400 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-400 hover:to-yellow-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
            Professional CV Builder
          </h1>
          <p className="text-gray-300 text-lg">Create a stunning resume that stands out</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button onClick={handleSave} className={buttonClass} disabled={saveStatus === 'saving'}>
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Progress'}
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg">
            <Eye className="w-4 h-4 mr-2" />
            Preview CV
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <CVSection title="Personal Information" icon={User}>
            {/* Name - Full Width for Prominence */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-purple-300 mb-2">Full Name *</label>
              <div className="relative group">
                <User className="absolute left-4 top-4 w-5 h-5 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.personalInfo.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, name: e.target.value }
                  }))}
                  className={`w-full ${inputClass} pl-12 py-4 text-lg font-medium border-2 focus:border-purple-400`}
                />
              </div>
            </div>

            {/* Contact Information Row */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-yellow-400 rounded-full"></div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="group">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="email"
                      placeholder="your.email@domain.com"
                      value={formData.personalInfo.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className={`w-full ${inputClass} pl-10`}
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.personalInfo.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      className={`w-full ${inputClass} pl-10`}
                    />
                  </div>
                </div>
                
                <div className="group md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="City, State/Country"
                      value={formData.personalInfo.location}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value }
                      }))}
                      className={`w-full ${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Online Presence */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-yellow-400 rounded-full"></div>
                Online Presence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Website/Portfolio</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={formData.personalInfo.website}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, website: e.target.value }
                      }))}
                      className={`w-full ${inputClass} pl-10`}
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-purple-300 mb-2">LinkedIn Profile</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.personalInfo.linkedin}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                      }))}
                      className={`w-full ${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-yellow-400 rounded-full"></div>
                Professional Summary
              </h3>
              <div className="relative group">
                <textarea
                  placeholder="Write a compelling professional summary that highlights your key achievements, skills, and career objectives. This is your elevator pitch to potential employers..."
                  value={formData.personalInfo.summary}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, summary: e.target.value }
                  }))}
                  rows={5}
                  className={`w-full ${inputClass} resize-none border-2 focus:border-purple-400 leading-relaxed`}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {formData.personalInfo.summary.length}/500 characters
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                💡 Tip: Keep it concise (2-3 sentences) and focus on your unique value proposition
              </div>
            </div>
          </CVSection>

          {/* Experience */}
          <CVSection title="Work Experience" icon={Briefcase}>
            {formData.experience.map((exp, index) => (
              <div key={index} className="border border-purple-400/20 rounded-lg p-6 mb-4 bg-slate-700/20 hover:bg-slate-700/30 transition-all duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Position/Title"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Duration (e.g., Jan 2020 - Present)"
                    value={exp.duration}
                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={exp.location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder="Job Description"
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  rows={3}
                  className={`w-full mb-4 ${inputClass} resize-none`}
                />
                
                {/* Achievements */}
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Key Achievements
                  </h4>
                  {exp.achievements?.map((achievement, achIndex) => (
                    <div key={achIndex} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Key achievement or accomplishment"
                        value={achievement}
                        onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                        className={`flex-1 ${inputClass}`}
                      />
                      <button
                        onClick={() => removeAchievement(index, achIndex)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addAchievement(index)}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Achievement
                  </button>
                </div>

                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Experience
                </button>
              </div>
            ))}
            <button onClick={addExperience} className={buttonClass}>
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </button>
          </CVSection>

          {/* Education */}
          <CVSection title="Education" icon={GraduationCap}>
            {formData.education.map((edu, index) => (
              <div key={index} className="border border-purple-400/20 rounded-lg p-6 mb-4 bg-slate-700/20 hover:bg-slate-700/30 transition-all duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Degree & Major"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Duration (e.g., 2018 - 2022)"
                    value={edu.duration}
                    onChange={(e) => updateEducation(index, 'duration', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="GPA (optional)"
                    value={edu.gpa}
                    onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={edu.location}
                    onChange={(e) => updateEducation(index, 'location', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Honors/Awards (optional)"
                  value={edu.honors}
                  onChange={(e) => updateEducation(index, 'honors', e.target.value)}
                  className={`w-full mb-4 ${inputClass}`}
                />
                <button
                  onClick={() => removeEducation(index)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Education
                </button>
              </div>
            ))}
            <button onClick={addEducation} className={buttonClass}>
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </button>
          </CVSection>

          {/* Projects */}
          <CVSection title="Projects" icon={Github}>
            {formData.projects.map((project, index) => (
              <div key={index} className="border border-purple-400/20 rounded-lg p-6 mb-4 bg-slate-700/20 hover:bg-slate-700/30 transition-all duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={project.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Technologies Used"
                    value={project.technologies}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder="Project Description"
                  value={project.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  rows={3}
                  className={`w-full mb-4 ${inputClass} resize-none`}
                />
                <div className="flex gap-4 mb-4">
                  <input
                    type="url"
                    placeholder="Project Link (optional)"
                    value={project.link}
                    onChange={(e) => updateProject(index, 'link', e.target.value)}
                    className={`flex-1 ${inputClass}`}
                  />
                </div>
                <button
                  onClick={() => removeProject(index)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Project
                </button>
              </div>
            ))}
            <button onClick={addProject} className={buttonClass}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </button>
          </CVSection>

          {/* Skills */}
          <CVSection title="Skills" icon={Award}>
            <div className="mb-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  onClick={addSkill}
                  className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-3 rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <SkillBadge
                    key={index}
                    skill={skill}
                    onRemove={() => removeSkill(skill)}
                  />
                ))}
              </div>
              {formData.skills.length === 0 && (
                <p className="text-gray-400 text-sm">No skills added yet. Start by typing a skill above.</p>
              )}
            </div>
          </CVSection>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400">
          <p>Your CV data is stored locally and never sent to external servers.</p>
        </div>
      </div>
    </div>
  );
};

export default CVForm;