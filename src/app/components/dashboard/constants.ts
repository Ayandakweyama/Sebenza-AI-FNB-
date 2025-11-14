import { NavigationItem } from './types';

export const navigationItems: NavigationItem[] = [
  { 
    title: 'Afrigter', 
    description: 'all in one AI powered career Mentor', 
    path: '/afrigter',
    icon: 'Bot'
  },
  { 
    title: 'Job Listings', 
    description: 'Browse available opportunities', 
    path: '/jobs',
    icon: 'Briefcase'
  },
  { 
    title: 'Your Profile', 
    description: 'Update your information', 
    path: '/profile',
    icon: 'User',
    
  },
  { 
    title: 'Applications', 
    description: 'Track your job applications', 
    path: '/applications',
    icon: 'ClipboardList'
  },
  // Analytics section removed as per user request
  // Networking section removed as per user request
  // Settings section removed as per user request
];

export const statsCards = [
  {
    title: 'Applications Sent',
    value: '24',
    change: '+12% this week',
    icon: 'Send',
    color: 'purple'
  },
  {
    title: 'Interviews',
    value: '5',
    change: '+2 scheduled',
    icon: 'Calendar',
    color: 'green'
  },
  {
    title: 'Profile Views',
    value: '87',
    change: '+23% this month',
    icon: 'Eye',
    color: 'blue'
  },
  {
    title: 'Response Rate',
    value: '21%',
    change: 'Above average',
    icon: 'TrendingUp',
    color: 'yellow'
  }
];

export const recentApplications = [
  { 
    company: 'TechCorp', 
    position: 'Senior Developer', 
    status: 'Interview Scheduled', 
    time: '2 hours ago', 
    color: 'green' 
  },
  { 
    company: 'StartupXYZ', 
    position: 'Full Stack Engineer', 
    status: 'Under Review', 
    time: '1 day ago', 
    color: 'yellow' 
  },
  { 
    company: 'BigTech Inc', 
    position: 'React Developer', 
    status: 'Application Sent', 
    time: '3 days ago', 
    color: 'blue' 
  }
];

export const upcomingInterviews = [
  { 
    company: 'TechCorp', 
    position: 'Senior Developer', 
    time: 'Today, 3:00 PM', 
    type: 'Technical' 
  },
  { 
    company: 'InnovateCo', 
    position: 'Frontend Lead', 
    time: 'Tomorrow, 10:00 AM', 
    type: 'Behavioral' 
  }
];

export const aiResponses = [
  "Based on your profile, I see you have strong technical skills. Have you considered exploring roles in AI/ML or cloud architecture? These fields are growing rapidly!",
  "I'd recommend focusing on building your personal brand through LinkedIn and contributing to open-source projects. This can significantly boost your visibility to recruiters!",
  "Your experience suggests you might thrive in a startup environment. Would you like me to suggest some strategies for finding and applying to innovative startups?",
  "Consider developing skills in emerging technologies like blockchain, cybersecurity, or data science. These areas have high demand and competitive salaries!",
  "Networking is crucial! I suggest attending virtual tech meetups, joining professional communities, and engaging with industry leaders on social media.",
  "Have you thought about freelancing or consulting? Your skillset could be perfect for project-based work while you search for your ideal full-time role!"
];
