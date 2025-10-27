'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Job } from '@/hooks/useJobScraper';

interface JobApplication {
  id: string;
  jobId: string;
  job: Job;
  appliedDate: string;
  status: 'applied' | 'interview' | 'rejected' | 'offer';
  notes?: string;
}

interface JobAlert {
  id: string;
  name: string;
  keywords: string;
  location: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdDate: string;
  lastSent?: string;
  newMatches: number;
}

interface JobContextType {
  // Saved Jobs
  savedJobs: Job[];
  saveJob: (job: Job) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  isSaved: (jobId: string) => boolean;
  
  // Applications
  applications: JobApplication[];
  applyToJob: (job: Job, notes?: string) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: JobApplication['status']) => Promise<void>;
  hasApplied: (jobId: string) => boolean;
  
  // Job Alerts
  jobAlerts: JobAlert[];
  createJobAlert: (alert: Omit<JobAlert, 'id' | 'createdDate' | 'newMatches'>) => Promise<void>;
  updateJobAlert: (alertId: string, updates: Partial<JobAlert>) => Promise<void>;
  deleteJobAlert: (alertId: string) => Promise<void>;
  toggleJobAlert: (alertId: string) => Promise<void>;
  
  // Loading states
  isLoading: {
    savedJobs: boolean;
    applications: boolean;
    jobAlerts: boolean;
  };
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [isLoading, setIsLoading] = useState({
    savedJobs: false,
    applications: false,
    jobAlerts: false,
  });

  // Load initial data
  useEffect(() => {
    loadSavedJobs();
    loadApplications();
    loadJobAlerts();
  }, []);

  // Saved Jobs Functions
  const loadSavedJobs = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, savedJobs: true }));
    try {
      const response = await fetch('/api/jobs/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, savedJobs: false }));
    }
  }, []);

  const saveJob = useCallback(async (job: Job) => {
    try {
      const response = await fetch('/api/jobs/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      
      if (response.ok) {
        setSavedJobs(prev => [...prev.filter(j => j.id !== job.id), job]);
      }
    } catch (error) {
      console.error('Failed to save job:', error);
      throw error;
    }
  }, []);

  const unsaveJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/saved/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error('Failed to unsave job:', error);
      throw error;
    }
  }, []);

  const isSaved = useCallback((jobId: string) => {
    return savedJobs.some(job => job.id === jobId);
  }, [savedJobs]);

  // Applications Functions
  const loadApplications = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, applications: true }));
    try {
      const response = await fetch('/api/jobs/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, applications: false }));
    }
  }, []);

  const applyToJob = useCallback(async (job: Job, notes?: string) => {
    try {
      const response = await fetch('/api/jobs/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, notes }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(prev => [...prev, data.application]);
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      throw error;
    }
  }, []);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: JobApplication['status']) => {
    try {
      const response = await fetch(`/api/jobs/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status } : app
          )
        );
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
      throw error;
    }
  }, []);

  const hasApplied = useCallback((jobId: string) => {
    return applications.some(app => app.jobId === jobId);
  }, [applications]);

  // Job Alerts Functions
  const loadJobAlerts = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, jobAlerts: true }));
    try {
      const response = await fetch('/api/jobs/alerts');
      if (response.ok) {
        const data = await response.json();
        setJobAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to load job alerts:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, jobAlerts: false }));
    }
  }, []);

  const createJobAlert = useCallback(async (alertData: Omit<JobAlert, 'id' | 'createdDate' | 'newMatches'>) => {
    try {
      const response = await fetch('/api/jobs/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobAlerts(prev => [...prev, data.alert]);
      }
    } catch (error) {
      console.error('Failed to create job alert:', error);
      throw error;
    }
  }, []);

  const updateJobAlert = useCallback(async (alertId: string, updates: Partial<JobAlert>) => {
    try {
      const response = await fetch(`/api/jobs/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        setJobAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId ? { ...alert, ...updates } : alert
          )
        );
      }
    } catch (error) {
      console.error('Failed to update job alert:', error);
      throw error;
    }
  }, []);

  const deleteJobAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/jobs/alerts/${alertId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setJobAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to delete job alert:', error);
      throw error;
    }
  }, []);

  const toggleJobAlert = useCallback(async (alertId: string) => {
    const alert = jobAlerts.find(a => a.id === alertId);
    if (alert) {
      await updateJobAlert(alertId, { isActive: !alert.isActive });
    }
  }, [jobAlerts, updateJobAlert]);

  const value: JobContextType = {
    savedJobs,
    saveJob,
    unsaveJob,
    isSaved,
    applications,
    applyToJob,
    updateApplicationStatus,
    hasApplied,
    jobAlerts,
    createJobAlert,
    updateJobAlert,
    deleteJobAlert,
    toggleJobAlert,
    isLoading,
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobContext() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
}
