export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
  location: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
  location: string;
  honors: string;
}

export interface Project {
  name: string;
  technologies: string;
  description: string;
  link: string;
}

export interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

export type Template = 'professional' | 'modern' | 'creative' | 'minimal';
