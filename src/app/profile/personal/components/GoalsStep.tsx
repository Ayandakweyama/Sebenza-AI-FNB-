'use client';

import { useFormContextData, useMultiStepForm } from './FormContext';
import { useForm } from 'react-hook-form';
import { ProfileFormData } from '../profile.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, DollarSign, Briefcase, MapPin, Target } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { industries, jobTypes } from '../profile.constants';

export function GoalsStep() {
  const { nextStep, prevStep } = useMultiStepForm();
  const { register, formState: { errors }, watch, setValue } = useFormContextData();

  const selectedIndustries = watch('industries') || [];
  const selectedJobTypes = watch('jobTypes') || [];
  const relocation = watch('relocation');
  const remotePreference = watch('remotePreference');

  const toggleIndustry = (industry: string) => {
    const newIndustries = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((ind) => ind !== industry)
      : [...selectedIndustries, industry];
    setValue('industries', newIndustries as any);
  };

  const toggleJobType = (jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship') => {
    const newJobTypes = selectedJobTypes.includes(jobType as any)
      ? selectedJobTypes.filter((type) => type !== jobType)
      : [...selectedJobTypes, jobType];
    setValue('jobTypes', newJobTypes as any);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Career Goals & Preferences</h2>
        <p className="text-slate-400">Help us find the best opportunities for you</p>
      </div>

      <div className="space-y-6">
        {/* Desired Job Title */}
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            Desired Job Title *
          </Label>
          <Input
            id="jobTitle"
            placeholder="e.g., Senior Frontend Developer"
            className={`${errors.jobTitle ? 'border-red-500' : ''} w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            {...register('jobTitle')}
          />
        </div>

        {/* Industries */}
        <div className="space-y-3">
          <Label className="block">Industries of Interest *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {industries.map((industry) => (
              <div key={industry} className="flex items-center space-x-2">
                <Checkbox
                  id={`industry-${industry}`}
                  checked={selectedIndustries.includes(industry)}
                  onCheckedChange={() => toggleIndustry(industry)}
                  className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label
                  htmlFor={`industry-${industry}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {industry}
                </Label>
              </div>
            ))}
          </div>
          {errors.industries && (
            <p className="text-sm text-red-500">{errors.industries.message}</p>
          )}
        </div>

        {/* Job Types */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-400" />
            Preferred Job Types *
          </Label>
          <div className="flex flex-wrap gap-3">
            {jobTypes.map((type) => (
              <div key={type} className="flex items-center">
                <Checkbox
                  id={`jobType-${type}`}
                  checked={selectedJobTypes.includes(type)}
                  onCheckedChange={() => toggleJobType(type as any)}
                  className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label
                  htmlFor={`jobType-${type}`}
                  className="ml-2 text-sm font-normal cursor-pointer"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>
          {errors.jobTypes && (
            <p className="text-sm text-red-500">{errors.jobTypes.message}</p>
          )}
        </div>

        {/* Salary Expectations */}
        <div className="space-y-2">
          <Label htmlFor="salaryExpectation" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-400" />
            Salary Expectation (annual)
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400">$</span>
            </div>
            <Input
              id="salaryExpectation"
              type="number"
              placeholder="e.g., 85000"
              className={`pl-8 w-full px-3 py-2 bg-slate-800 border ${errors.salaryExpectation ? 'border-red-500' : 'border-slate-700'} rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              {...register('salaryExpectation', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Location Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <Label>Location Preferences</Label>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="relocation"
                checked={relocation}
                onCheckedChange={(checked) => setValue('relocation', !!checked)}
                className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="relocation" className="text-sm font-normal">
                Open to relocation
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Remote Work Preference *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'On-site', label: 'On-site' },
                  { value: 'Hybrid', label: 'Hybrid' },
                  { value: 'Remote', label: 'Remote' },
                  { value: 'Flexible', label: 'Flexible' },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setValue('remotePreference', option.value as any)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      remotePreference === option.value
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                  </div>
                ))}
              </div>
              {errors.remotePreference && (
                <p className="text-sm text-red-500">{errors.remotePreference.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Career Goals */}
        <div className="space-y-2">
          <Label htmlFor="careerGoals">Career Goals & Aspirations</Label>
          <textarea
            id="careerGoals"
            placeholder="I aim to become a senior developer in the next 3 years..."
            className="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
            {...register('careerGoals')}
          />
          <p className="text-xs text-slate-400">
            This helps us provide better career guidance and opportunities.
          </p>
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
          type="button" 
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: CV Style
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
