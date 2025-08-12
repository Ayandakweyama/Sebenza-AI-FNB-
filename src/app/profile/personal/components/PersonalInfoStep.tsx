'use client';

import { useMultiStepForm } from './FormContext';
import { useFormContext } from 'react-hook-form';
import { ProfileFormData } from '../profile.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronRight, Camera } from 'lucide-react';
import { Label } from '@/components/ui/label';

// Simple Avatar component since we're having issues with the UI library
const Avatar = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative rounded-full overflow-hidden ${className}`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt }: { src?: string, alt: string }) => (
  src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : null
);

const AvatarFallback = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-medium ${className}`}>
    {children}
  </div>
);

export function PersonalInfoStep() {
  const { nextStep } = useMultiStepForm();
  const { register, formState: { errors }, watch, setValue } = useFormContext<ProfileFormData>();
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      console.log('Selected file:', file);
      // For now, just update the form state
      setValue('profilePhoto', file as any);
    }
  };

  const firstName = watch('firstName') || '';
  const lastName = watch('lastName') || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Personal Information</h2>
        <p className="text-slate-400">Tell us about yourself</p>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-blue-500">
              <AvatarImage src="" alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="bg-blue-600 text-2xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <label 
                htmlFor="profile-photo" 
                className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 cursor-pointer transition-colors inline-flex items-center justify-center"
              >
                <Camera className="h-5 w-5" />
                <input 
                  id="profile-photo" 
                  type="file" 
                  className="sr-only"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Click the camera icon to upload a profile photo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input 
            id="firstName" 
            placeholder="John" 
            {...register('firstName')} 
            error={errors.firstName?.message}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input 
            id="lastName" 
            placeholder="Doe" 
            {...register('lastName')} 
            error={errors.lastName?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="john@example.com" 
            {...register('email')} 
            error={errors.email?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input 
            id="phone" 
            type="tel" 
            placeholder="+1 (555) 123-4567" 
            {...register('phone')} 
            error={errors.phone?.message}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="location">Location *</Label>
          <Input 
            id="location" 
            placeholder="City, Country" 
            {...register('location')} 
            error={errors.location?.message}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Professional Bio</Label>
          <textarea 
            id="bio" 
            placeholder="A brief introduction about yourself and your professional background..." 
            rows={4} 
            className="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('bio')} 
          />
          {errors.bio?.message && (
            <p className="text-sm text-red-500">{errors.bio.message}</p>
          )}
          <p className="text-xs text-slate-400">Max 500 characters</p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="button" 
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Education
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
