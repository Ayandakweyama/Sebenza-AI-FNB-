import { JobCard } from '@/components/Jobs/JobCard';
import { Button } from '@/components/ui/button';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { Briefcase, Clock, CheckCircle, Clock as ClockIcon, XCircle, AlertCircle, DollarSign, Bookmark } from 'lucide-react';
import Link from 'next/link';

// Mock data - in a real app, this would come from your data fetching logic
const applications = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'Cape Town, South Africa',
    type: 'Full-time',
    salary: 'R80,000 - R100,000',
    posted: '2 days ago',
    appliedDate: '2023-06-15',
    status: 'applied',
    description: 'Application submitted and under review by the hiring team.',
    skills: ['React', 'TypeScript', 'Next.js'],
    match: 92,
    isSaved: true
  },
  {
    id: '2',
    title: 'UI/UX Designer',
    company: 'DesignHub',
    location: 'Remote',
    type: 'Contract',
    salary: 'R600 - R800 per hour',
    posted: '1 week ago',
    appliedDate: '2023-06-10',
    status: 'interview',
    description: 'Interview scheduled for next week. Prepare your portfolio and case studies.',
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    match: 87,
    isSaved: true
  },
  {
    id: '3',
    title: 'Product Manager',
    company: 'InnoTech',
    location: 'Johannesburg, South Africa',
    type: 'Full-time',
    salary: 'R90,000 - R120,000',
    posted: '3 weeks ago',
    appliedDate: '2023-06-01',
    status: 'rejected',
    description: 'Position has been filled. Keep an eye on our careers page for future opportunities.',
    skills: ['Product Management', 'Agile', 'JIRA'],
    match: 78,
    isSaved: false
  },
];

const statusIcons = {
  applied: <ClockIcon className="h-4 w-4 text-blue-400" />,
  interview: <CheckCircle className="h-4 w-4 text-yellow-400" />,
  rejected: <XCircle className="h-4 w-4 text-red-400" />,
  offer: <CheckCircle className="h-4 w-4 text-green-400" />,
  other: <AlertCircle className="h-4 w-4 text-gray-400" />
};

const statusLabels = {
  applied: 'Application Submitted',
  interview: 'Interview Stage',
  rejected: 'Not Selected',
  offer: 'Offer Received',
  other: 'Update Available'
};

export default function ApplicationsPage() {
  const handleSaveJob = (jobId: string) => {
    // Handle save/unsave job logic
    console.log('Toggle save for job:', jobId);
  };

  const handleViewJob = (jobId: string) => {
    // Handle view job details
    console.log('View application:', jobId);
  };
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Your Applications"
          description="Track the status of your job applications"
        />
        
        <div className="space-y-6 mt-6">
          <div className="flex justify-end">
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            <Link href="/jobs/all">
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Link>
          </Button>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/jobs/saved">
              <Briefcase className="h-4 w-4 mr-2" />
              View Saved Jobs
            </Link>
          </Button>
        </div>
          </div>
          
          {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <div 
              key={application.id} 
              className="relative group bg-slate-800/50 hover:bg-slate-800/70 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{application.title}</h3>
                      <p className="text-purple-200">{application.company} • {application.location}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        application.status === 'interview' ? 'bg-yellow-500/20 text-yellow-400' :
                        application.status === 'offer' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {statusIcons[application.status as keyof typeof statusIcons]}
                        <span className="ml-1.5">{statusLabels[application.status as keyof typeof statusLabels]}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center text-slate-300">
                      <Briefcase className="h-4 w-4 mr-2 text-purple-400" />
                      <span>{application.type}</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                      <span>{application.salary}</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Clock className="h-4 w-4 mr-2 text-blue-400" />
                      <span>Applied {application.appliedDate}</span>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-slate-300">{application.description}</p>
                  
                  {application.skills && application.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {application.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:text-purple-400 transition-colors"
                    onClick={() => handleViewJob(application.id)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant={application.isSaved ? 'secondary' : 'outline'} 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={() => handleSaveJob(application.id)}
                  >
                    <Bookmark className={`h-4 w-4 mr-2 ${application.isSaved ? 'fill-current' : ''}`} />
                    {application.isSaved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
            <Briefcase className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">No applications yet</h3>
          <p className="mt-2 text-sm text-slate-300">Your job applications will appear here once you start applying.</p>
          <div className="mt-6">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/jobs/all">
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Jobs
              </Link>
            </Button>
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
