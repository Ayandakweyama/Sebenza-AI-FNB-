import type { Job } from '@/hooks/useJobScraper';

export const mockJobs: Job[] = [
  {
    id: 'mock-1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'Cape Town, South Africa',
    type: 'Full-time',
    salary: 'R80,000 - R100,000',
    posted: '2 days ago',
    description: 'We are looking for an experienced Frontend Developer to join our growing team. You will be responsible for building user interfaces and implementing features using modern web technologies like React, TypeScript, and Next.js.',
    url: 'https://example.com/job/1',
    source: 'indeed',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    match: 92
  },
  {
    id: 'mock-2',
    title: 'UI/UX Designer',
    company: 'DesignHub',
    location: 'Remote',
    type: 'Contract',
    salary: 'R600 - R800 per hour',
    posted: '1 week ago',
    description: 'Join our design team to create beautiful and intuitive user experiences for our clients. You will work closely with product managers and developers to bring designs to life.',
    url: 'https://example.com/job/2',
    source: 'pnet',
    skills: ['Figma', 'UI/UX', 'Prototyping', 'User Research'],
    match: 87
  },
  {
    id: 'mock-3',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'Johannesburg, South Africa',
    type: 'Full-time',
    salary: 'R70,000 - R90,000',
    posted: '3 days ago',
    description: 'Looking for a versatile Full Stack Developer to work on our cutting-edge web applications. Experience with both frontend and backend technologies required.',
    url: 'https://example.com/job/3',
    source: 'careerjunction',
    skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
    match: 85
  },
  {
    id: 'mock-4',
    title: 'Product Manager',
    company: 'InnoTech',
    location: 'Durban, South Africa',
    type: 'Full-time',
    salary: 'R90,000 - R120,000',
    posted: '5 days ago',
    description: 'We need a strategic Product Manager to drive our product roadmap and work with cross-functional teams to deliver exceptional user experiences.',
    url: 'https://example.com/job/4',
    source: 'indeed',
    skills: ['Product Management', 'Agile', 'JIRA', 'Analytics'],
    match: 78
  },
  {
    id: 'mock-5',
    title: 'DevOps Engineer',
    company: 'CloudTech',
    location: 'Remote',
    type: 'Full-time',
    salary: 'R95,000 - R130,000',
    posted: '1 day ago',
    description: 'Join our DevOps team to build and maintain scalable cloud infrastructure. Experience with AWS, Docker, and Kubernetes is essential.',
    url: 'https://example.com/job/5',
    source: 'pnet',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    match: 90
  },
  {
    id: 'mock-6',
    title: 'Data Scientist',
    company: 'DataCorp',
    location: 'Cape Town, South Africa',
    type: 'Full-time',
    salary: 'R85,000 - R110,000',
    posted: '4 days ago',
    description: 'Seeking a Data Scientist to analyze complex datasets and build machine learning models to drive business insights and decision-making.',
    url: 'https://example.com/job/6',
    source: 'careerjunction',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    match: 82
  }
];
