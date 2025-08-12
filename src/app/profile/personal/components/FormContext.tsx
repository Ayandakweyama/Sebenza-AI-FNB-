'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { 
  useForm, 
  FormProvider, 
  useFormContext as useReactHookFormContext, 
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  DefaultValues,
  FieldErrors,
  UseFormProps,
  UseFormReturn as UseFormReturnType,
  Resolver
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileFormSchema, ProfileFormData } from '../profile.schema';

export type FormStep = 'personal' | 'education' | 'experience' | 'skills' | 'goals' | 'cv';

// Use the full UseFormReturn type for better type safety
type FormContextValue = {
  currentStep: FormStep;
  goToStep: (step: FormStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  steps: { id: FormStep; label: string }[];
  isSubmitting: boolean;
  form: UseFormReturn<ProfileFormData>;
};

// Create a custom hook to access the form context
export const useMultiStepFormContext = () => {
  const context = useContext(FormContext);
  
  if (!context) {
    throw new Error('useMultiStepFormContext must be used within a MultiStepFormProvider');
  }
  
  return context;
};

// Re-export the form context hook for convenience
export const useFormContext = useReactHookFormContext;

const FormContext = createContext<FormContextValue | undefined>(undefined);

export const useMultiStepForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useMultiStepForm must be used within a MultiStepFormProvider');
  }
  return context;
};

export const MultiStepFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize form with default values
  const defaultValues: DefaultValues<ProfileFormData> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    education: [{
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: new Date(),
      current: false,
    }],
    workExperience: [{
      company: '',
      position: '',
      startDate: new Date(),
      current: false,
    }],
    technicalSkills: [{ name: '', level: 'Intermediate' }],
    softSkills: [],
    languages: [{ name: '', proficiency: 'Conversational' }],
    jobTypes: [],
    industries: [],
    remotePreference: 'Flexible',
    template: 'Professional',
    colorScheme: '#2563eb',
    fontFamily: 'Arial',
    showPhoto: true,
  };

  const formMethods = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: { id: FormStep; label: string }[] = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills' },
    { id: 'goals', label: 'Goals' },
    { id: 'cv', label: 'CV Style' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goToStep = (step: FormStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].id);
    }
  };

  const prevStep = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].id);
    }
  };

  const handleSubmit = async (data: ProfileFormData) => {
    if (!isLastStep) {
      nextStep();
      return;
    }

    try {
      setIsSubmitting(true);
      // Handle form submission here
      console.log('Form submitted:', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    return handleSubmit(data);
  };

  const contextValue = useMemo<FormContextValue>(() => ({
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    steps,
    isSubmitting,
    form: formMethods,
  }), [
    currentStep, 
    isFirstStep, 
    isLastStep, 
    isSubmitting, 
    steps, 
    formMethods
  ]);

  return (
    <FormContext.Provider value={contextValue}>
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="w-full">
          {children}
        </form>
      </FormProvider>
    </FormContext.Provider>
  );
};

export const useFormContextData = () => {
  return useFormContext<ProfileFormData>();
};
