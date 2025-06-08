'use client';
import React, { useState } from 'react';
import { Download, Eye, FileText, ArrowRight } from 'lucide-react';
import CVLayout from '../components/cvbuilder/CVLayout';
import CVForm from '../components/cvbuilder/CVForm';
import CVPreview from '../components/cvbuilder/CVPreview';

// Add padding to the top of the page to account for the fixed navbar
const pageStyle = {
  paddingTop: '4rem', // h-16 (navbar height) + 1rem (padding)
};

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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-yellow-400 bg-clip-text text-transparent">
              Choose a Template
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Select a template that best fits your style and industry. You can customize it later.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {templates.map((template) => (
              <div 
                key={template.id}
                onClick={() => handleTemplateSelect(template.id as Template)}
                className="bg-slate-800 rounded-xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="h-48 bg-slate-700 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">📄</div>
                    <h3 className="text-xl font-semibold">{template.name} Template</h3>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                  <p className="text-gray-400 mb-4">{template.description}</p>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <CVLayout template={selectedTemplate as Template}>
        <div className="container mx-auto px-4 mb-6">
          <button 
            onClick={handleBackToTemplates}
            className="text-purple-400 hover:text-purple-300 flex items-center text-sm mb-4 transition-colors"
          >
            ← Back to Templates
          </button>
        </div>
        <main className="text-white">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-purple-200 to-yellow-400 bg-clip-text text-transparent">
                CV Builder
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Create a professional resume that stands out. Fill in your information and watch your CV come to life in real-time.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Form Section */}
            <div className="space-y-6">
              <CVForm formData={formData} setFormData={setFormData} />
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-6 py-3 rounded-full font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Download PDF</span>
                </button>
                <button className="border-2 border-purple-400 text-purple-300 px-6 py-3 rounded-full font-semibold hover:bg-purple-400 hover:text-white transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
                <CVPreview formData={formData} selectedTemplate={selectedTemplate as Template} />
              </div>
            </div>
          </div>
        </main>
      </CVLayout>
    </div>
  );
};

export default CVBuilderPage;