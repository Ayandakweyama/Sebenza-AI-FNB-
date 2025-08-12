'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone, 
  FiArrowRight, 
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiBookOpen, // Replacing FiGraduationCap with FiBookOpen
  FiCalendar,
  FiFileText,
  FiGlobe
} from 'react-icons/fi';
import FormField from './FormField';
import SocialAuth from './SocialAuth';
import TermsAndPrivacy from './TermsAndPrivacy';
import { FormData } from './types';

interface EnhancedFormData extends FormData {
  // Location & Contact
  city: string;
  state: string;
  country: string;
  linkedinUrl: string;
  portfolioUrl: string;
  
  // Professional Info
  currentJobTitle: string;
  industry: string;
  experienceLevel: string;
  currentCompany: string;
  
  // Job Preferences
  desiredJobTitle: string;
  desiredSalaryMin: string;
  desiredSalaryMax: string;
  jobType: string;
  workArrangement: string;
  willingToRelocate: boolean;
  
  // Education & Skills
  education: string;
  university: string;
  graduationYear: string;
  keySkills: string;
  
  // Documents
  resume: File | null;
  coverLetter: File | null;
  
  // Terms
  acceptTerms: boolean;
  subscribeToNewsletter: boolean;
}

const RegistrationForm = () => {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const [formData, setFormData] = useState<EnhancedFormData>({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Location & Contact
    city: '',
    state: '',
    country: '',
    linkedinUrl: '',
    portfolioUrl: '',
    
    // Professional Info
    currentJobTitle: '',
    industry: '',
    experienceLevel: '',
    currentCompany: '',
    
    // Job Preferences
    desiredJobTitle: '',
    desiredSalaryMin: '',
    desiredSalaryMax: '',
    jobType: '',
    workArrangement: '',
    willingToRelocate: false,
    
    // Education & Skills
    education: '',
    university: '',
    graduationYear: '',
    skills: [],
    newSkill: '',
    
    // Documents
    resume: null,
    coverLetter: null,
    
    // Terms
    acceptTerms: false,
    subscribeToNewsletter: false,
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    
    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions to register.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create user with Clerk
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      // Prepare user metadata for Clerk
      const metadata = {
        publicMetadata: {
          phone: formData.phone,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          linkedinUrl: formData.linkedinUrl,
          portfolioUrl: formData.portfolioUrl,
          currentJobTitle: formData.currentJobTitle,
          industry: formData.industry,
          experienceLevel: formData.experienceLevel,
          currentCompany: formData.currentCompany,
          desiredJobTitle: formData.desiredJobTitle,
          desiredSalaryMin: formData.desiredSalaryMin,
          desiredSalaryMax: formData.desiredSalaryMax,
          jobType: formData.jobType,
          workArrangement: formData.workArrangement,
          willingToRelocate: formData.willingToRelocate,
          education: formData.education,
          university: formData.university,
          graduationYear: formData.graduationYear,
          skills: formData.skills,
          subscribeToNewsletter: formData.subscribeToNewsletter,
        }
      };
      
      // Update user with metadata
      await result.update(metadata);
      
      // Send verification email
      await result.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Redirect to verification page
      router.push('/verify-email');
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.errors?.[0]?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'github' | 'facebook') => {
    console.log(`Logging in with ${provider}`);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
        <p className="text-sm text-slate-600">Let's start with your basic details</p>
      </div>
      
      <FormField
        id="firstName"
        name="firstName"
        type="text"
        label="First Name"
        placeholder="John"
        value={formData.firstName}
        onChange={handleChange}
        icon={<FiUser className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <FormField
        id="lastName"
        name="lastName"
        type="text"
        label="Last Name"
        placeholder="Doe"
        value={formData.lastName}
        onChange={handleChange}
        icon={<FiUser className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <FormField
        id="email"
        name="email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        icon={<FiMail className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <FormField
        id="phone"
        name="phone"
        type="tel"
        label="Phone Number"
        placeholder="+1 (555) 123-4567"
        value={formData.phone}
        onChange={handleChange}
        icon={<FiPhone className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <FormField
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        icon={<FiLock className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm Password"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        icon={<FiLock className="h-5 w-5 text-slate-400" />}
        required
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Location & Professional Background</h2>
        <p className="text-sm text-slate-600">Help us understand your professional background</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="city"
          name="city"
          type="text"
          label="City"
          placeholder="New York"
          value={formData.city}
          onChange={handleChange}
          icon={<FiMapPin className="h-5 w-5 text-slate-400" />}
          required
        />
        
        <FormField
          id="state"
          name="state"
          type="text"
          label="State/Province"
          placeholder="NY"
          value={formData.state}
          onChange={handleChange}
          icon={<FiMapPin className="h-5 w-5 text-slate-400" />}
        />
      </div>
      
      <FormField
        id="country"
        name="country"
        type="text"
        label="Country"
        placeholder="United States"
        value={formData.country}
        onChange={handleChange}
        icon={<FiGlobe className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <FormField
        id="currentJobTitle"
        name="currentJobTitle"
        type="text"
        label="Current Job Title"
        placeholder="Software Engineer"
        value={formData.currentJobTitle}
        onChange={handleChange}
        icon={<FiBriefcase className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <FormField
        id="currentCompany"
        name="currentCompany"
        type="text"
        label="Current Company (Optional)"
        placeholder="Tech Corp Inc."
        value={formData.currentCompany}
        onChange={handleChange}
        icon={<FiBriefcase className="h-5 w-5 text-slate-400" />}
      />
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Industry <span className="text-red-500">*</span>
        </label>
        <select
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select your industry</option>
          <option value="technology">Technology</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
          <option value="education">Education</option>
          <option value="marketing">Marketing</option>
          <option value="sales">Sales</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="retail">Retail</option>
          <option value="consulting">Consulting</option>
          <option value="other">Other</option>
        </select>
        {error.industry && <p className="mt-1 text-sm text-red-600">{error.industry}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Experience Level <span className="text-red-500">*</span>
        </label>
        <select
          name="experienceLevel"
          value={formData.experienceLevel}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select experience level</option>
          <option value="entry">Entry Level (0-2 years)</option>
          <option value="mid">Mid Level (3-5 years)</option>
          <option value="senior">Senior Level (6-10 years)</option>
          <option value="lead">Lead/Principal (10+ years)</option>
          <option value="executive">Executive</option>
        </select>
        {error.experienceLevel && <p className="mt-1 text-sm text-red-600">{error.experienceLevel}</p>}
      </div>
      
      <FormField
        id="linkedinUrl"
        name="linkedinUrl"
        type="url"
        label="LinkedIn Profile (Optional)"
        placeholder="https://linkedin.com/in/yourprofile"
        value={formData.linkedinUrl}
        onChange={handleChange}
        icon={<FiGlobe className="h-5 w-5 text-slate-400" />}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Job Preferences & Education</h2>
        <p className="text-sm text-slate-600">Tell us about your career goals and background</p>
      </div>
      
      <FormField
        id="desiredJobTitle"
        name="desiredJobTitle"
        type="text"
        label="Desired Job Title"
        placeholder="Senior Software Engineer"
        value={formData.desiredJobTitle}
        onChange={handleChange}
        icon={<FiBriefcase className="h-5 w-5 text-slate-400" />}
        required
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="desiredSalaryMin"
          name="desiredSalaryMin"
          type="number"
          label="Min Salary (Optional)"
          placeholder="75000"
          value={formData.desiredSalaryMin}
          onChange={handleChange}
          icon={<FiDollarSign className="h-5 w-5 text-slate-400" />}
        />
        
        <FormField
          id="desiredSalaryMax"
          name="desiredSalaryMax"
          type="number"
          label="Max Salary (Optional)"
          placeholder="120000"
          value={formData.desiredSalaryMax}
          onChange={handleChange}
          icon={<FiDollarSign className="h-5 w-5 text-slate-400" />}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Job Type Preference <span className="text-red-500">*</span>
        </label>
        <select
          name="jobType"
          value={formData.jobType}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select job type</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="freelance">Freelance</option>
          <option value="internship">Internship</option>
        </select>
        {error.jobType && <p className="mt-1 text-sm text-red-600">{error.jobType}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Work Arrangement <span className="text-red-500">*</span>
        </label>
        <select
          name="workArrangement"
          value={formData.workArrangement}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select work arrangement</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
          <option value="flexible">Flexible</option>
        </select>
        {error.workArrangement && <p className="mt-1 text-sm text-red-600">{error.workArrangement}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Education Level <span className="text-red-500">*</span>
        </label>
        <select
          name="education"
          value={formData.education}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Select education level</option>
          <option value="high-school">High School</option>
          <option value="associate">Associate Degree</option>
          <option value="bachelor">Bachelor's Degree</option>
          <option value="master">Master's Degree</option>
          <option value="phd">PhD</option>
          <option value="other">Other</option>
        </select>
        {error.education && <p className="mt-1 text-sm text-red-600">{error.education}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="university"
          name="university"
          type="text"
          label="University (Optional)"
          placeholder="MIT"
          value={formData.university}
          onChange={handleChange}
          icon={<FiBookOpen className="h-5 w-5 text-slate-400" />}
        />
        
        <FormField
          id="graduationYear"
          name="graduationYear"
          type="number"
          label="Graduation Year (Optional)"
          placeholder="2020"
          value={formData.graduationYear}
          onChange={handleChange}
          icon={<FiCalendar className="h-5 w-5 text-slate-400" />}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Key Skills (Optional)
        </label>
        <textarea
          name="skills"
          value={formData.skills.join(', ')}
          onChange={handleChange}
          placeholder="React, Node.js, Python, AWS, etc. (comma-separated)"
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-slate-500">Separate skills with commas</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start">
          <input
            id="willingToRelocate"
            name="willingToRelocate"
            type="checkbox"
            checked={formData.willingToRelocate}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="willingToRelocate" className="ml-2 text-sm text-slate-700">
            I'm willing to relocate for the right opportunity
          </label>
        </div>
        
        <div className="flex items-start">
          <input
            id="subscribeToNewsletter"
            name="subscribeToNewsletter"
            type="checkbox"
            checked={formData.subscribeToNewsletter}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="subscribeToNewsletter" className="ml-2 text-sm text-slate-700">
            Send me job alerts and career tips via email
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-white/80">Join Sebenza AI and find your dream job</p>
        
        {/* Progress indicator */}
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step <= currentStep ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="ml-4 text-sm text-slate-600">Step {currentStep} of 3</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          
          {error && (
            <div className="mt-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="ml-auto flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                Next
                <FiArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="ml-auto flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  'Creating account...'
                ) : (
                  <>
                    Create Account
                    <FiArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
          
          {currentStep === 1 && (
            <div className="text-center text-sm text-slate-600 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-purple-600 hover:text-purple-700">
                Sign in
              </Link>
            </div>
          )}
        </form>
        
        {currentStep === 1 && <SocialAuth callbackUrl="/dashboard" />}
        
        <TermsAndPrivacy className="mt-6" />
      </div>
    </div>
  );
};

export default RegistrationForm;