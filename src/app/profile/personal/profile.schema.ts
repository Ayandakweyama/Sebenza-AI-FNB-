import { z } from 'zod';

// Common schemas
const dateSchema = z.preprocess((arg) => {
  if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
}, z.date());

// Step 1: Personal Info
const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  location: z.string().min(2, 'Please enter your location'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profilePhoto: z.instanceof(FileList).optional(),
});

// Step 2: Education
const educationSchema = z.object({
  education: z.array(
    z.object({
      institution: z.string().min(2, 'Institution name is required'),
      degree: z.string().min(2, 'Degree is required'),
      fieldOfStudy: z.string().min(2, 'Field of study is required'),
      startDate: dateSchema,
      endDate: dateSchema.optional(),
      current: z.boolean().default(false),
      description: z.string().optional(),
    })
  ),
});

// Step 3: Work Experience
const workExperienceSchema = z.object({
  workExperience: z.array(
    z.object({
      company: z.string().min(2, 'Company name is required'),
      position: z.string().min(2, 'Position is required'),
      startDate: dateSchema,
      endDate: dateSchema.optional(),
      current: z.boolean().default(false),
      description: z.string().optional(),
      achievements: z.array(z.string()).optional(),
    })
  ),
});

// Step 4: Skills
const skillsSchema = z.object({
  technicalSkills: z.array(
    z.object({
      name: z.string().min(1, 'Skill name is required'),
      level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
    })
  ),
  softSkills: z.array(z.string()).min(1, 'At least one skill is required'),
  languages: z.array(
    z.object({
      name: z.string().min(1, 'Language is required'),
      proficiency: z.enum(['Basic', 'Conversational', 'Fluent', 'Native']),
    })
  ),
});

// Step 5: Goals & Preferences
const goalsSchema = z.object({
  jobTitle: z.string().min(2, 'Job title is required'),
  industries: z.array(z.string()).min(1, 'Select at least one industry'),
  jobTypes: z.array(z.enum(['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'])),
  salaryExpectation: z.number().min(0, 'Salary must be a positive number').optional(),
  relocation: z.boolean().default(false),
  remotePreference: z.enum(['On-site', 'Hybrid', 'Remote', 'Flexible']),
  careerGoals: z.string().optional(),
});

// Step 6: CV Style
const cvStyleSchema = z.object({
  template: z.enum(['Modern', 'Professional', 'Creative', 'Minimalist', 'Executive']),
  colorScheme: z.string().default('#2563eb'),
  fontFamily: z.enum(['Arial', 'Helvetica', 'Times New Roman', 'Calibri', 'Georgia']),
  showPhoto: z.boolean().default(true),
  customSections: z.array(z.string()).optional(),
});

// Combined Schema
export const profileFormSchema = z.intersection(
  personalInfoSchema,
  z.intersection(
    educationSchema,
    z.intersection(
      workExperienceSchema,
      z.intersection(
        skillsSchema,
        z.intersection(
          goalsSchema,
          cvStyleSchema
        )
      )
    )
  )
);

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Education = z.infer<typeof educationSchema>['education'][number];
export type WorkExperience = z.infer<typeof workExperienceSchema>['workExperience'][number];
export type Skills = z.infer<typeof skillsSchema>;
export type Goals = z.infer<typeof goalsSchema>;
export type CVStyle = z.infer<typeof cvStyleSchema>;
