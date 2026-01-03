'use client';

import { useJobContext } from '@/contexts/JobContext';
import { Briefcase, Clock, Bell, CheckCircle } from 'lucide-react';

export default function NavigationStatus() {
  const { applications, jobAlerts, isLoading } = useJobContext();

  const stats = [
    {
      name: 'All Jobs',
      icon: Briefcase,
      count: 'Browse',
      description: 'Search and discover opportunities',
      status: 'active',
      href: '/jobs/all'
    },
    {
      name: 'Applications',
      icon: Clock,
      count: applications.length,
      description: `${applications.length} applications submitted`,
      status: applications.length > 0 ? 'active' : 'empty',
      href: '/jobs/applications'
    },
    {
      name: 'Job Alerts',
      icon: Bell,
      count: jobAlerts.length,
      description: `${jobAlerts.length} alerts configured`,
      status: jobAlerts.length > 0 ? 'active' : 'empty',
      href: '/jobs/alerts'
    }
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Navigation Status</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`p-4 rounded-lg border transition-all ${
                stat.status === 'active' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${
                  stat.status === 'active' ? 'text-green-400' : 'text-slate-400'
                }`} />
                <span className="font-medium text-white">{stat.name}</span>
              </div>
              
              <div className="text-2xl font-bold text-white mb-1">
                {typeof stat.count === 'number' ? stat.count : stat.count}
              </div>
              
              <div className="text-sm text-slate-300">
                {stat.description}
              </div>
              
              <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${
                stat.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-slate-600/20 text-slate-400'
              }`}>
                {stat.status === 'active' ? '✓ Working' : '○ Ready'}
              </div>
            </div>
          );
        })}
      </div>
      
      {(isLoading.applications || isLoading.jobAlerts) && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-sm">Loading job data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
