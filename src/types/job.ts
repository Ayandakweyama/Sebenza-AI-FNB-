export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  skills?: string[];
  jobType?: string;
  postedDate?: string;
  rating?: number;
  benefits?: string[];
  requirements?: string[];
  companyLogo?: string;
  url?: string;
  snippet?: string;
  source?: string;
  updated?: string;
  salaryType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
}
