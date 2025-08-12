import React, { useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { 
  Plus, 
  Trash2, 
  Save, 
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

// Type definitions
interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  website: string;
  linkedin: string;
  github: string;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
  location: string;
  achievements: string[];
}

interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
  location: string;
  honors: string;
}

interface Project {
  name: string;
  technologies: string;
  description: string;
  link: string;
}

interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

// CVSection Props
interface CVSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  collapsible?: boolean;
}

// CVSection Component
const CVSection = ({ title, icon: Icon, children, collapsible = false }: CVSectionProps) => {
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

// SkillBadge Props
interface SkillBadgeProps {
  skill: string;
  onRemove: () => void;
}

// Skill Badge Component
const SkillBadge = ({ skill, onRemove }: SkillBadgeProps) => (
  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-yellow-400/20 border border-purple-400/30 rounded-full px-3 py-1 text-sm text-white">
    <span>{skill}</span>
    <button onClick={onRemove} className="hover:text-red-400 transition-colors">
      <Trash2 className="w-3 h-3" />
    </button>
  </div>
);

const CVForm = () => {
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      website: '',
      linkedin: '',
      github: ''
    },
    experience: [],
    education: [],
    skills: [],
    projects: []
  });

  const [newSkill, setNewSkill] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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
        } as Experience
      ]
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
        i === index ? { 
          ...exp, 
          [field]: field === 'achievements' && Array.isArray(value) 
            ? value 
            : value as string 
        } : exp
      )
    }));
  };

  const addAchievement = (expIndex: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === expIndex ? { 
          ...exp, 
          achievements: [...(exp.achievements || []), ''] 
        } : exp
      )
    }));
  };

  const updateAchievement = (expIndex: number, achievementIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        
        const updatedAchievements = [...(exp.achievements || [])];
        updatedAchievements[achievementIndex] = value;
        
        return {
          ...exp,
          achievements: updatedAchievements
        };
      })
    }));
  };

  const removeAchievement = (expIndex: number, achievementIndex: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        
        const updatedAchievements = (exp.achievements || []).filter((_, j) => j !== achievementIndex);
        return {
          ...exp,
          achievements: updatedAchievements
        };
      })
    }));
  };

  // Education handlers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { 
        institution: '', 
        degree: '', 
        duration: '', 
        gpa: '', 
        location: '', 
        honors: '' 
      } as Education]
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
        i === index ? { 
          ...edu, 
          [field]: value 
        } : edu
      )
    }));
  };

  // Project handlers
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { 
        name: '', 
        technologies: '', 
        description: '', 
        link: '' 
      } as Project]
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
        i === index ? { 
          ...proj, 
          [field]: value 
        } : proj
      )
    }));
  };

  // Skills handlers
  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
      setFormData(prev => ({ 
        ...prev, 
        skills: [...prev.skills, trimmedSkill] 
      }));
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
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      // Here you would typically send the data to an API
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          // Log only a summary of the form data to avoid cluttering the console
          console.log('Form data saved:', {
            personalInfo: { ...formData.personalInfo },
            experience: formData.experience.length,
            education: formData.education.length,
            skills: formData.skills.length,
            projects: formData.projects.length
          });
          resolve();
        }, 1000);
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveStatus('idle');
    }
  };

  // Handle input change for personal info
  // Generic handler for personal info changes
  const handlePersonalInfoChange = (field: keyof PersonalInfo) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: e.target.value
        }
      }));
    };

  // Generic handler for experience changes
  const handleExperienceChange = (index: number, field: keyof Experience) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateExperience(index, field, e.target.value);
    };

  // Generic handler for education changes
  const handleEducationChange = (index: number, field: keyof Education) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateEducation(index, field, e.target.value);
    };

  // Generic handler for project changes
  const handleProjectChange = (index: number, field: keyof Project) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateProject(index, field, e.target.value);
    };

  const inputClass = "bg-slate-700/50 border border-purple-400/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 hover:border-purple-400/50 w-full";
  const buttonClass = "bg-pink-500 hover:bg-pink-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center";
  const sectionButtonClass = "bg-slate-700/50 hover:bg-slate-600/50 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-purple-400/20";

  return (
    <form onSubmit={handleSave} className="min-h-screen bg-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent mb-3 sm:mb-4">
            Professional CV Builder
          </h1>
          <p className="text-gray-300 text-base sm:text-lg">Create a stunning resume that stands out</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-8">
          <button 
            onClick={handleSave} 
            className={`${buttonClass} ${saveStatus === 'saving' ? 'opacity-75 cursor-not-allowed' : ''}`} 
            disabled={saveStatus === 'saving'}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Progress'}
          </button>
          <button 
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 shadow-lg flex items-center"
            onClick={(e) => {
              e.preventDefault();
              // Handle preview logic here
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Preview CV</span>
            <span className="sm:hidden">Preview</span>
          </button>
          <button 
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 shadow-lg flex items-center"
            onClick={(e) => {
              e.preventDefault();
              // Handle export logic here
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
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
                  onChange={handlePersonalInfoChange('name')}
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
                      onChange={handlePersonalInfoChange('email')}
                      className={`w-full ${inputClass} pl-10`}
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium text-purple-300 mb-2">GitHub Profile</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="url"
                      placeholder="https://github.com/yourusername"
                      value={formData.personalInfo.github}
                      onChange={handlePersonalInfoChange('github')}
                      className={`w-full ${inputClass} pl-10`}
                    />
                  </div>
                </div>
                
                <div className="group md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-purple-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.personalInfo.phone}
                      onChange={handlePersonalInfoChange('phone')}
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
                      onChange={handlePersonalInfoChange('location')}
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
                      onChange={handlePersonalInfoChange('website')}
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
                      onChange={handlePersonalInfoChange('linkedin')}
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
                  onChange={handlePersonalInfoChange('summary')}
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
                  className="bg-pink-500 hover:bg-pink-400 text-white px-4 py-3 rounded-lg transition-all duration-200"
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
    </form>
  );
};

export default CVForm;