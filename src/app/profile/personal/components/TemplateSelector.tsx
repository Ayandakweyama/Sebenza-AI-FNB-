'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface TemplateSelectorProps {
  selectedTemplate: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive';
  onTemplateChange: (template: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive') => void;
  colorScheme: string;
}

const templates = [
  {
    name: 'Professional',
    description: 'Clean and traditional layout perfect for corporate roles',
    preview: 'Traditional two-column layout with clear sections',
    features: ['Clean typography', 'Professional color scheme', 'ATS-friendly format']
  },
  {
    name: 'Modern',
    description: 'Contemporary design with gradient header and visual elements',
    preview: 'Gradient header with skill level indicators',
    features: ['Gradient backgrounds', 'Visual skill bars', 'Modern typography']
  },
  {
    name: 'Creative',
    description: 'Artistic design with vibrant colors and unique layouts',
    preview: 'Colorful design with artistic elements and emojis',
    features: ['Vibrant colors', 'Creative sections', 'Artistic elements']
  },
  {
    name: 'Minimalist',
    description: 'Ultra-clean design focusing on content over decoration',
    preview: 'Spacious layout with minimal visual elements',
    features: ['Lots of white space', 'Clean typography', 'Minimal design']
  },
  {
    name: 'Executive',
    description: 'Premium design for senior-level positions',
    preview: 'Sophisticated layout for executive roles',
    features: ['Premium styling', 'Executive focus', 'Professional appeal']
  }
] as const;

export function TemplateSelector({ selectedTemplate, onTemplateChange, colorScheme }: TemplateSelectorProps) {
  return (
    <div>
      <Label className="block mb-4 text-lg font-semibold">
        Choose Template
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.name}
            onClick={() => onTemplateChange(template.name)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedTemplate === template.name
                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800/70'
            }`}
          >
            {/* Template Preview */}
            <div className="relative mb-3 h-32 bg-white rounded overflow-hidden">
              {template.name === 'Professional' && (
                <div className="p-2 text-xs">
                  <div className="border-b border-gray-300 pb-1 mb-2">
                    <div className="font-bold text-gray-900">John Doe</div>
                    <div className="text-gray-600">Software Engineer</div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 bg-gray-200 rounded"></div>
                    <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              )}
              
              {template.name === 'Modern' && (
                <div className="h-full">
                  <div 
                    className="h-8 p-2 text-white text-xs font-bold"
                    style={{ background: `linear-gradient(to right, ${colorScheme}, #7c3aed)` }}
                  >
                    John Doe
                  </div>
                  <div className="p-2 text-xs space-y-1">
                    <div className="h-1 bg-blue-200 rounded"></div>
                    <div className="h-1 bg-blue-200 rounded w-3/4"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-1 bg-blue-600 rounded"></div>
                      <div className="w-2 h-1 bg-blue-600 rounded"></div>
                      <div className="w-2 h-1 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {template.name === 'Creative' && (
                <div className="h-full bg-gradient-to-br from-purple-100 to-pink-100">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-8 p-2 text-white text-xs font-bold">
                    🎨 John Doe
                  </div>
                  <div className="p-2 text-xs space-y-1">
                    <div className="h-1 bg-purple-300 rounded"></div>
                    <div className="h-1 bg-pink-300 rounded w-2/3"></div>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {template.name === 'Minimalist' && (
                <div className="p-3 h-full">
                  <div className="text-lg font-light text-gray-900 mb-2 tracking-wider text-xs">
                    JOHN DOE
                  </div>
                  <div className="border-t border-gray-200 pt-2 space-y-2">
                    <div className="h-1 bg-gray-100 rounded"></div>
                    <div className="h-1 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-1 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              )}
              
              {template.name === 'Executive' && (
                <div className="p-2 h-full bg-gray-50">
                  <div className="border-l-4 border-gray-800 pl-2 mb-2">
                    <div className="font-bold text-gray-900 text-xs">JOHN DOE</div>
                    <div className="text-gray-600 text-xs">Chief Executive Officer</div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 bg-gray-300 rounded"></div>
                    <div className="h-1 bg-gray-300 rounded w-4/5"></div>
                    <div className="h-1 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
              )}
              
              {/* Selection Indicator */}
              {selectedTemplate === template.name && (
                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            {/* Template Info */}
            <div>
              <h3 className={`font-semibold mb-1 ${
                selectedTemplate === template.name ? 'text-white' : 'text-slate-200'
              }`}>
                {template.name}
              </h3>
              <p className={`text-sm mb-2 ${
                selectedTemplate === template.name ? 'text-slate-200' : 'text-slate-400'
              }`}>
                {template.description}
              </p>
              
              {/* Features */}
              <div className="space-y-1">
                {template.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${
                      selectedTemplate === template.name ? 'bg-blue-400' : 'bg-slate-500'
                    }`}></div>
                    <span className={`text-xs ${
                      selectedTemplate === template.name ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TemplateSelector;
