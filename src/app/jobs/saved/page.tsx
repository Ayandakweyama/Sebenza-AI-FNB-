'use client';

import { JobCard } from '@/components/Jobs/JobCard';
import { Button } from '@/components/ui/button';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { Bookmark, Briefcase, Clock, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useJobContext } from '@/contexts/JobContext';
import { useEffect } from 'react';


export default function SavedJobsPage() {
  const { savedJobs, unsaveJob, isLoading } = useJobContext();

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
    } catch (error) {
      console.error('Failed to unsave job:', error);
    }
  };

  const handleViewJob = (jobId: string) => {
    // Handle view job details
    console.log('View job:', jobId);
  };
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Saved Jobs"
          description="Your saved job opportunities"
        />
        
        <div className="space-y-6 mt-6">
          <div className="flex justify-end">
        <Button asChild variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
          <Link href="/jobs/all">
            <Briefcase className="h-4 w-4 mr-2" />
            Browse All Jobs
          </Link>
        </Button>
          </div>
          
          {isLoading.savedJobs ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-purple-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading saved jobs...</span>
              </div>
            </div>
          ) : savedJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {savedJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  variant="saved"
                  onSave={handleUnsaveJob}
                  onView={handleViewJob}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
            <Bookmark className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">No saved jobs yet</h3>
          <p className="mt-2 text-sm text-slate-300">Jobs you save will appear here for easy access.</p>
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
