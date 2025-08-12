'use client';

import { useFormContextData, useMultiStepForm } from './FormContext';
import { useFieldArray } from 'react-hook-form';
import { ProfileFormData } from '../profile.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export function EducationStep() {
  const { nextStep, prevStep } = useMultiStepForm();
  const { control, register, formState: { errors }, watch } = useFormContextData();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education',
  });

  const addNewEducation = () => {
    append({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: new Date(),
      current: false,
    });
  };

  const removeEducation = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Education</h2>
        <p className="text-slate-400">Add your educational background</p>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 relative">
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                aria-label="Remove education"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`education.${index}.institution`}>
                  Institution *
                </Label>
                <Input
                  id={`education.${index}.institution`}
                  {...register(`education.${index}.institution` as const)}
                  className={`${errors.education?.[index]?.institution ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`education.${index}.degree`}>
                  Degree *
                </Label>
                <Input
                  id={`education.${index}.degree`}
                  placeholder="Bachelor of Science"
                  {...register(`education.${index}.degree` as const)}
                  className={`${errors.education?.[index]?.degree ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`education.${index}.fieldOfStudy`}>
                  Field of Study *
                </Label>
                <Input
                  id={`education.${index}.fieldOfStudy`}
                  placeholder="Computer Science"
                  {...register(`education.${index}.fieldOfStudy` as const)}
                  className={`${errors.education?.[index]?.fieldOfStudy ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`education.${index}.startDate`}>
                  Start Date *
                </Label>
                <Input
                  id={`education.${index}.startDate`}
                  type="date"
                  {...register(`education.${index}.startDate`)}
                  className={`${errors.education?.[index]?.startDate ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`education.${index}.current`}
                    {...register(`education.${index}.current` as const)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  <Label htmlFor={`education.${index}.current`} className="text-sm font-medium">
                    I currently study here
                  </Label>
                </div>
              </div>

              {!watch(`education.${index}.current`) && (
                <div className="space-y-2">
                  <Label htmlFor={`education.${index}.endDate`}>
                    End Date *
                  </Label>
                  <Input
                    id={`education.${index}.endDate`}
                    type="date"
                    {...register(`education.${index}.endDate`)}
                    className={`${errors.education?.[index]?.endDate ? 'border-red-500' : ''}`}
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`education.${index}.description`}>
                  Description (Optional)
                </Label>
                <textarea
                  id={`education.${index}.description`}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notable achievements, coursework, or activities..."
                  {...register(`education.${index}.description`)}
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addNewEducation}
          className="w-full mt-2 border-dashed border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Education
        </Button>
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
          type="button" 
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Work Experience
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
