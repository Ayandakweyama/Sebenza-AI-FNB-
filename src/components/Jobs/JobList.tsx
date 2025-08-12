import { JobCard } from './JobCard';

interface JobListProps {
  jobs?: any[]; // Replace 'any' with your Job type
}

export function JobList({ jobs: propJobs }: JobListProps = {}) {
  // This would come from your data fetching logic
  const jobs = propJobs || [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'Tech Corp',
      location: 'Remote',
      type: 'Full-time',
      salary: '$90,000 - $120,000',
      posted: '2 days ago',
      description: 'We are looking for an experienced frontend developer to join our team...',
      skills: ['React', 'TypeScript', 'Next.js']
    },
    // Add more sample jobs as needed
  ];

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
