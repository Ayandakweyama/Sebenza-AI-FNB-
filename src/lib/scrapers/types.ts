export interface Job {
  id?: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  postedDate: string;
  description: string;
  jobType?: string;
  industry?: string;
  reference?: string;
  url: string;
  source: 'indeed' | 'pnet' | 'careerjunction' | 'linkedin' | 'adzuna';
}

export interface ScraperConfig {
  query: string;
  location: string;
  maxPages?: number;
}

export interface ScraperResult {
  jobs: Job[];
  success: boolean;
  error?: string;
  source: string;
  count: number;
}
