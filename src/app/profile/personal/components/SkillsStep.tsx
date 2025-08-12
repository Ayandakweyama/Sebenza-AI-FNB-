'use client';

import { useFormContextData, useMultiStepForm } from './FormContext';
import { useFieldArray } from 'react-hook-form';
import { ProfileFormData } from '../profile.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, X, Globe, Languages } from 'lucide-react';
import { Label } from '@/components/ui/label';
// Custom select component to replace the missing UI library select
const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export function SkillsStep() {
  const { nextStep, prevStep } = useMultiStepForm();
  const { 
    control, 
    register, 
    formState: { errors }, 
    watch, 
    setValue 
  } = useFormContextData();
  
  // Get current form values with type safety
  const formValues = watch();
  
  // Type assertions for form values
  type FormValues = typeof formValues & {
    currentTechSkill?: string;
    currentSoftSkill?: string;
    currentLanguage?: string;
    currentProficiency?: string;
  };
  
  // Technical Skills
  const { fields: techSkills, append: appendTechSkill, remove: removeTechSkill } = useFieldArray({
    control,
    name: 'technicalSkills',
  });

  // Languages
  const { fields: languages, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'languages',
  });

  // Get current form values with type safety
  const currentTechSkill = (formValues as FormValues).currentTechSkill || '';
  const currentSoftSkill = (formValues as FormValues).currentSoftSkill || '';
  const currentLanguage = (formValues as FormValues).currentLanguage || '';
  const currentProficiency = (formValues as FormValues).currentProficiency as 'Basic' | 'Conversational' | 'Fluent' | 'Native' || 'Basic';
  const softSkills = formValues.softSkills || [];

  const addTechSkill = () => {
    if (currentTechSkill && typeof currentTechSkill === 'string' && currentTechSkill.trim() !== '') {
      appendTechSkill({ 
        name: currentTechSkill.trim(),
        level: 'Intermediate' as const
      });
      setValue('currentTechSkill' as any, '');
    }
  };

  const addLanguage = () => {
    if (currentLanguage && typeof currentLanguage === 'string' && currentLanguage.trim() !== '') {
      appendLanguage({ 
        name: currentLanguage.trim(), 
        proficiency: currentProficiency as 'Basic' | 'Conversational' | 'Fluent' | 'Native'
      });
      setValue('currentLanguage' as any, '');
      setValue('currentProficiency' as any, 'Basic');
    }
  };

  const addSoftSkill = () => {
    if (currentSoftSkill && typeof currentSoftSkill === 'string' && currentSoftSkill.trim() !== '') {
      const newSoftSkills = [...(softSkills || []), currentSoftSkill.trim()];
      setValue('softSkills' as any, newSoftSkills);
      setValue('currentSoftSkill' as any, '');
    }
  };

  const removeSoftSkill = (index: number) => {
    const newSoftSkills = [...(softSkills || [])];
    newSoftSkills.splice(index, 1);
    setValue('softSkills' as any, newSoftSkills);
  };

  const proficiencyLevels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' },
  ];

  const languageProficiency = [
    { value: 'Basic', label: 'Basic' },
    { value: 'Conversational', label: 'Conversational' },
    { value: 'Fluent', label: 'Fluent' },
    { value: 'Native', label: 'Native' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Skills & Languages</h2>
        <p className="text-slate-400">Showcase your technical abilities and language skills</p>
      </div>

      {/* Technical Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Technical Skills</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTechSkill}
            className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>

        <div className="space-y-4">
          {techSkills.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-5">
                <div className="w-full">
                  <Input
                    {...register(`technicalSkills.${index}.name`)}
                    placeholder="Skill name"
                    className={errors.technicalSkills?.[index]?.name ? 'border-red-500' : ''}
                  />
                  {errors.technicalSkills?.[index]?.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.technicalSkills?.[index]?.name?.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-5">
                <select
                  {...register(`technicalSkills.${index}.level`)}
                  value={field.level}
                  onChange={(e) => setValue(`technicalSkills.${index}.level`, e.target.value as any)}
                  className="w-40 rounded-md border border-gray-300 p-2"
                >
                  {proficiencyLevels.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTechSkill(index)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Input
              {...register('currentTechSkill')}
              placeholder="Add a technical skill"
              className={errors.currentTechSkill ? 'border-red-500' : ''}
            />
            {errors.currentTechSkill && (
              <p className="mt-1 text-sm text-red-500">{errors.currentTechSkill.message}</p>
            )}
          </div>
          <Button
            type="button"
            onClick={addTechSkill}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Soft Skills */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-semibold text-white">Soft Skills</h3>
        <div className="flex flex-wrap gap-2">
          {softSkills.map((skill, index) => (
            <div
              key={index}
              className="flex items-center bg-slate-800/50 px-3 py-1.5 rounded-full text-sm text-white"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSoftSkill(index)}
                className="ml-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              {...register('currentSoftSkill')}
              placeholder="Add a soft skill"
              className={errors.currentSoftSkill ? 'border-red-500' : ''}
            />
            {errors.currentSoftSkill && (
              <p className="mt-1 text-sm text-red-500">{errors.currentSoftSkill.message}</p>
            )}
          </div>
          <Button
            type="button"
            onClick={addSoftSkill}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Languages</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLanguage}
            className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
          >
            <Globe className="h-4 w-4 mr-2" />
            Add Language
          </Button>
        </div>

        <div className="space-y-4">
          {languages.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-5">
                <div className="w-full">
                  <Input
                    {...register(`languages.${index}.name`)}
                    placeholder="Language name"
                    className={errors.languages?.[index]?.name ? 'border-red-500' : ''}
                  />
                  {errors.languages?.[index]?.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.languages?.[index]?.name?.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-5">
                <select
                  {...register(`languages.${index}.proficiency`)}
                  value={field.proficiency}
                  onChange={(e) => setValue(`languages.${index}.proficiency`, e.target.value as any)}
                  className="w-40 rounded-md border border-gray-300 p-2"
                >
                  {languageProficiency.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLanguage(index)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6">
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
          type="button" 
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Career Goals
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
