export type OpportunityType = 'Graduate Programme' | 'Internship' | 'Learnership' | 'Bursary' | 'Entry-Level Job';

export type OpportunitySource = 'graduates24' | 'prosple' | 'studentroom' | 'limpopo24' | 'employers-of-choice';

export type CareerOpportunity = {
  id: string;
  title: string;
  url: string;
  source: OpportunitySource;
  type: OpportunityType;
  careerField: string | null;
  location: string | null;
  postedDate: string | null;
  closingDate: string | null;
  openingDate: string | null;
  snippet: string | null;
};
