import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';

interface ApplicationListProps {
  applications?: Array<{
    id: string;
    jobTitle: string;
    company: string;
    status: 'applied' | 'interview' | 'rejected' | 'offer';
    appliedDate: string;
    updatedAt: string;
  }>;
}

export function ApplicationList({ applications = [] }: ApplicationListProps) {
  if (applications.length === 0) {
    return null;
  }

  const statusIcons = {
    applied: <ClockIcon className="h-4 w-4 text-blue-500" />,
    interview: <Clock className="h-4 w-4 text-yellow-500" />,
    rejected: <XCircle className="h-4 w-4 text-red-500" />,
    offer: <CheckCircle className="h-4 w-4 text-green-500" />,
  };

  const statusLabels = {
    applied: 'Applied',
    interview: 'Interview',
    rejected: 'Rejected',
    offer: 'Offer Received',
  };

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div key={application.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{application.jobTitle}</h3>
              <p className="text-gray-600">{application.company}</p>
            </div>
            <div className="flex items-center space-x-2">
              {statusIcons[application.status]}
              <span className="text-sm text-gray-600">
                {statusLabels[application.status]}
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Applied: {application.appliedDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Updated: {application.updatedAt}</span>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button variant="outline" size="sm">
              Withdraw
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
