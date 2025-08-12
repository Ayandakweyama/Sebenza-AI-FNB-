'use client';
import React, { useState } from 'react';
import { Download, Eye, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import CVLayout from '../components/cvbuilder/CVLayout';
import CVForm from '../components/cvbuilder/CVForm';
import CVPreview from '../components/cvbuilder/CVPreview';

// Template types
type Template = 'professional' | 'modern' | 'creative' | 'minimal';

const templates = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and traditional design perfect for corporate roles',
    image: '/templates/professional.png',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sleek design with a contemporary look for all industries',
    image: '/templates/modern.png',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for creative professionals and designers',
    image: '/templates/creative.png',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean layout that focuses on your content',
    image: '/templates/minimal.png',
  },
];

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

const CVBuilderPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
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
    experience: [
      {
        company: '',
        position: '',
        duration: '',
        description: '',
        location: '',
        achievements: ['']
      }
    ],
    education: [
      {
        institution: '',
        degree: '',
        duration: '',
        gpa: '',
        location: '',
        honors: ''
      }
    ],
    skills: [],
    projects: [
      {
        name: '',
        technologies: '',
        description: '',
        link: ''
      }
    ]
  });

  const handleTemplateSelect = (templateId: Template) => {
    setSelectedTemplate(templateId);
    // Scroll to top when template is selected
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
  };

  // Template selection view
  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
              CV Builder
            </h1>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
              Create a professional CV in minutes with our easy-to-use builder. Select a template to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {templates.map((template) => (
              <div 
                key={template.id}
                onClick={() => handleTemplateSelect(template.id as Template)}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-pink-500/30 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="h-48 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10"></div>
                  <div className="relative h-full flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <div className="text-3xl">📄</div>
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                        {template.name} Template
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{template.name}</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-500/10 text-pink-400">
                      Popular
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{template.description}</p>
                  <button className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
                    Select Template <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CV Form view with selected template
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <CVLayout template={selectedTemplate as Template}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={handleBackToTemplates}
              className="inline-flex items-center text-pink-400 hover:text-pink-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </button>
            <h2 className="text-3xl font-bold text-white mb-2">
              CV Builder - <span className="text-pink-400">{selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}</span> Template
            </h2>
            <p className="text-gray-300">
              Create a professional CV that stands out. Fill in your information and watch your CV come to life in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <CVForm formData={formData} setFormData={setFormData} />
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-start pt-4">
                <button className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2.5 rounded-md font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Download PDF</span>
                </button>
                <button className="border border-pink-500 text-pink-400 px-6 py-2.5 rounded-md font-medium hover:bg-pink-900/30 transition-all duration-200 flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <CVPreview formData={formData} selectedTemplate={selectedTemplate as Template} />
              </div>
            </div>
          </div>
        </div>
      </CVLayout>
    </div>
  );
};

export default CVBuilderPage;