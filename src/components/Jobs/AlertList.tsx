import { Bell, BellOff, MapPin, Briefcase, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertListProps {
  alerts?: Array<{
    id: string;
    title: string;
    location: string;
    jobType: string;
    frequency: string;
    isActive: boolean;
    lastSent: string;
  }>;
}

export function AlertList({ alerts = [] }: AlertListProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${alert.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {alert.isActive ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{alert.title}</h3>
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {alert.location}
                  </span>
                  <span className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {alert.jobType}
                  </span>
                  <span>•</span>
                  <span>Updates: {alert.frequency}</span>
                  <span>•</span>
                  <span>Last sent: {alert.lastSent}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="text-gray-600">
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-gray-600">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
