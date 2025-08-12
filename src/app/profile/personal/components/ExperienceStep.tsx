'use client';

import { useFormContextData, useMultiStepForm } from './FormContext';
import { useFieldArray } from 'react-hook-form';
import { ProfileFormData } from '../profile.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function ExperienceStep() {
  const { nextStep, prevStep } = useMultiStepForm();
  const { control, register, formState: { errors }, watch, setValue } = useFormContextData();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'workExperience',
  });

  const addNewExperience = () => {
    append({
      company: '',
      position: '',
      startDate: new Date(),
      current: false,
      endDate: new Date(),
      description: '',
      achievements: [] as string[]
    });
  };

  const removeExperience = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const addNewAchievement = (expIndex: number) => {
    const currentAchievements = watch(`workExperience.${expIndex}.achievements`) as string[] || [];
    setValue(
      `workExperience.${expIndex}.achievements` as const,
      [...currentAchievements, '']
    );
  };

  const removeAchievement = (expIndex: number, achIndex: number) => {
    const currentAchievements = watch(`workExperience.${expIndex}.achievements`) as string[] || [];
    const newAchievements = [...currentAchievements];
    newAchievements.splice(achIndex, 1);
    setValue(`workExperience.${expIndex}.achievements` as const, newAchievements);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Work Experience</h2>
        <p className="text-slate-400">Add your professional work history</p>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 relative">
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                aria-label="Remove experience"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`workExperience.${index}.company`}>
                  Company *
                </Label>
                <Input
                  id={`workExperience.${index}.company`}
                  placeholder="Acme Inc."
                  {...register(`workExperience.${index}.company` as const)}
                  className={`${errors.workExperience?.[index]?.company ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`workExperience.${index}.position`}>
                  Position *
                </Label>
                <Input
                  id={`workExperience.${index}.position`}
                  placeholder="Senior Developer"
                  {...register(`workExperience.${index}.position` as const)}
                  className={`${errors.workExperience?.[index]?.position ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`workExperience.${index}.startDate`}>
                  Start Date *
                </Label>
                <Input
                  id={`workExperience.${index}.startDate`}
                  type="date"
                  {...register(`workExperience.${index}.startDate` as const)}
                  className={`${errors.workExperience?.[index]?.startDate ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`workExperience.${index}.current`}
                    {...register(`workExperience.${index}.current`)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  <Label htmlFor={`workExperience.${index}.current`} className="text-sm font-medium">
                    I currently work here
                  </Label>
                </div>
              </div>

              {!watch(`workExperience.${index}.current`) && (
                <div className="space-y-2">
                  <Label htmlFor={`workExperience.${index}.endDate`}>
                    End Date *
                  </Label>
                  <Input
                    id={`workExperience.${index}.endDate`}
                    type="date"
                    {...register(`workExperience.${index}.endDate` as const)}
                    className={`${errors.workExperience?.[index]?.endDate ? 'border-red-500' : ''}`}
                  />
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`workExperience.${index}.description`}>
                  Job Description
                </Label>
                <textarea
                  id={`workExperience.${index}.description`}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your role and responsibilities..."
                  {...register(`workExperience.${index}.description`)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Key Achievements</Label>
                <div className="space-y-2">
                  {((watch(`workExperience.${index}.achievements`) as string[]) || []).map((_, aIndex) => (
                    <div key={aIndex} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          placeholder="E.g., Increased performance by 30%"
                          {...register(`workExperience.${index}.achievements.${aIndex}` as const)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAchievement(index, aIndex)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addNewAchievement(index)}
                    className="mt-2 text-slate-300 border-slate-600 hover:bg-slate-800/50 hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Achievement
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addNewExperience}
          className="w-full mt-2 border-dashed border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Position
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
          Next: Skills
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
