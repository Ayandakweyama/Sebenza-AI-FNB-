'use client';

import { useFormContextData, useMultiStepForm } from './FormContext';
import { useFormContext as useHookFormContext } from 'react-hook-form';
import { ProfileFormData } from '../profile.schema';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, Palette, Type, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { Label } from '@/components/ui/label';

const templates = [
  { id: 'modern', name: 'Modern', thumbnail: '/templates/modern.png' },
  { id: 'professional', name: 'Professional', thumbnail: '/templates/professional.png' },
  { id: 'creative', name: 'Creative', thumbnail: '/templates/creative.png' },
  { id: 'minimalist', name: 'Minimalist', thumbnail: '/templates/minimalist.png' },
  { id: 'executive', name: 'Executive', thumbnail: '/templates/executive.png' },
];

const colorSchemes = [
  { name: 'Blue', value: '#2563eb', class: 'bg-blue-600' },
  { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Violet', value: '#7c3aed', class: 'bg-violet-600' },
  { name: 'Rose', value: '#e11d48', class: 'bg-rose-600' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
];

const fontFamilies = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
];

export function CVStyleStep() {
  const { prevStep, isLastStep, isSubmitting } = useMultiStepForm();
  const { register, formState: { errors }, watch, setValue } = useFormContextData();

  const selectedTemplate = watch('template');
  const selectedColor = watch('colorScheme');
  const selectedFont = watch('fontFamily');
  const showPhoto = watch('showPhoto');
  const customSections = watch('customSections') || [];

  const toggleCustomSection = (section: string) => {
    const newSections = customSections.includes(section)
      ? customSections.filter(s => s !== section)
      : [...customSections, section];
    setValue('customSections', newSections);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">CV Style & Layout</h2>
        <p className="text-slate-400">Customize the look and feel of your CV</p>
      </div>

      <div className="space-y-8">
        {/* Template Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-blue-400" />
              Select a Template
            </Label>
            <span className="text-sm text-slate-400">
              {templates.find(t => t.id === selectedTemplate)?.name || 'Not selected'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setValue('template', template.id as any)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="aspect-[1/1.414] bg-slate-800 flex items-center justify-center">
                  <div className="text-slate-600 text-sm">{template.name}</div>
                </div>
                {selectedTemplate === template.id && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {errors.template && (
            <p className="mt-1 text-sm text-red-500">{errors.template.message}</p>
          )}
        </div>

        {/* Color Scheme */}
        <div>
          <Label className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-blue-400" />
            Color Scheme
          </Label>
          <div className="flex flex-wrap gap-3">
            {colorSchemes.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setValue('colorScheme', color.value)}
                className={`w-10 h-10 rounded-full ${color.class} flex items-center justify-center transition-transform hover:scale-110`}
                aria-label={`Select ${color.name} color`}
              >
                {selectedColor === color.value && (
                  <Check className="h-5 w-5 text-white" />
                )}
              </button>
            ))}
            <div className="relative">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setValue('colorScheme', e.target.value)}
                className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 cursor-pointer"
              />
              {!colorSchemes.some(c => c.value === selectedColor) && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <Label className="flex items-center gap-2 mb-3">
            <Type className="h-5 w-5 text-blue-400" />
            Font Family
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {fontFamilies.map((font) => (
              <div
                key={font.value}
                onClick={() => setValue('fontFamily', font.value as any)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFont === font.value
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800/70'
                }`}
                style={{ fontFamily: font.value }}
              >
                <div className="text-sm font-medium">{font.name}</div>
                <div className="text-xs text-slate-400">Aa Bb Cc</div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-400" />
              Profile Photo
            </Label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showPhoto}
                onChange={(e) => setValue('showPhoto', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <Label className="block mb-3">Custom Sections</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Certifications', 'Projects', 'Publications', 'Volunteer Work', 'Awards', 'Languages'].map((section) => (
                <div
                  key={section}
                  onClick={() => toggleCustomSection(section)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    customSections.includes(section)
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{section}</span>
                    {customSections.includes(section) && (
                      <Check className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={prevStep}
          className="border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </div>
    </div>
  );
}
