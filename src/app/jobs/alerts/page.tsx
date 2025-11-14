'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { Plus, Bell, Search, X, Mail, Settings, Clock, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useJobContext } from '@/contexts/JobContext';
import JobAlertModal from '@/components/Jobs/JobAlertModal';

// Mock data - in a real app, this would come from your data fetching logic
const jobAlerts = [
  {
    id: '1',
    name: 'Frontend Developer Jobs',
    keywords: 'react, typescript, frontend',
    location: 'Cape Town, South Africa',
    frequency: 'Daily',
    lastSent: 'Today, 08:30',
    isActive: true,
    newMatches: 5
  },
  {
    id: '2',
    name: 'Remote Design Jobs',
    keywords: 'ui/ux, product design, figma',
    location: 'Remote',
    frequency: 'Weekly',
    lastSent: '2 days ago',
    isActive: true,
    newMatches: 0
  },
  {
    id: '3',
    name: 'Senior Product Manager',
    keywords: 'product management, agile, saas',
    location: 'Johannesburg, South Africa',
    frequency: 'Weekly',
    lastSent: '1 week ago',
    isActive: false,
    newMatches: 0
  },
];

export default function JobAlertsPage() {
  const { jobAlerts, deleteJobAlert, toggleJobAlert, createJobAlert, updateJobAlert } = useJobContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);

  const handleCreateAlert = async (alertData: any) => {
    await createJobAlert(alertData);
    setIsModalOpen(false);
  };

  const handleUpdateAlert = async (alertId: string, alertData: any) => {
    await updateJobAlert(alertId, alertData);
    setEditingAlert(null);
    setIsModalOpen(false);
  };

  const handleEditAlert = (alert: any) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  const toggleAlertStatus = async (alertId: string, currentStatus: boolean) => {
    await toggleJobAlert(alertId);
  };

  const handleDeleteAlert = async (alertId: string) => {
    await deleteJobAlert(alertId);
  };
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Job Alerts"
          description="Get notified about new job opportunities that match your criteria"
        />
        
        <div className="space-y-6 mt-6">
          <div className="flex justify-end">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Alert
        </Button>
          </div>
          
          {jobAlerts.length > 0 ? (
        <div className="space-y-4">
          {jobAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Bell className={`h-5 w-5 mr-2 ${alert.isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      {alert.name}
                      {alert.newMatches > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {alert.newMatches} new
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => toggleAlertStatus(alert.id, alert.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          alert.isActive ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`${
                            alert.isActive ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </button>
                      <span className="text-xs text-slate-400">
                        {alert.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-start text-slate-300">
                      <Search className="h-4 w-4 mt-0.5 mr-2 text-blue-400 flex-shrink-0" />
                      <span className="break-words">{alert.keywords}</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <MapPin className="h-4 w-4 mr-2 text-blue-400 flex-shrink-0" />
                      <span>{alert.location}</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Clock className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" />
                      <span>Sent {alert.frequency.toLowerCase()}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 text-xs text-slate-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1.5" />
                    Last alert: {alert.lastSent}
                    {alert.newMatches > 0 && (
                      <span className="ml-3 text-purple-300">
                        {alert.newMatches} new {alert.newMatches === 1 ? 'match' : 'matches'} found
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-slate-300 border-slate-600 hover:bg-slate-700/50 hover:border-purple-500/30 hover:text-purple-400"
                    onClick={() => handleEditAlert(alert)}
                  >
                    <Settings className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-dashed border-slate-700/50 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 mb-4">
              <Bell className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Need more specific alerts?</h3>
            <p className="mt-1 text-sm text-slate-300 max-w-md mx-auto">
              Create custom job alerts with specific keywords, locations, and job types to get the most relevant opportunities.
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Alert
              </Button>
            </div>
          </div>
        </div>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 mb-4">
            <Bell className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-white">No job alerts yet</h3>
          <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
            Create your first job alert to get notified about new opportunities that match your skills and preferences.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Alert Modal */}
      <JobAlertModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAlert(null);
        }}
        onCreateAlert={handleCreateAlert}
        onUpdateAlert={handleUpdateAlert}
        editAlert={editingAlert}
      />
    </div>
  );
}
