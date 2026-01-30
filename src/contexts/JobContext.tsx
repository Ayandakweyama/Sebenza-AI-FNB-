'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getValidToken, exponentialBackoff } from '@/utils/authHelpers';
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
  // Applications
  applications: JobApplication[];
  applyToJob: (job: Job, notes?: string) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: JobApplication['status']) => Promise<void>;
  hasApplied: (jobId: string) => boolean;
  
  // Saved Jobs
  savedJobs: Job[];
  saveJob: (job: Job) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  isSaved: (jobId: string) => boolean;
  
  // Job Alerts
  jobAlerts: JobAlert[];
  createJobAlert: (alert: Omit<JobAlert, 'id' | 'createdDate' | 'newMatches'>) => Promise<void>;
  updateJobAlert: (alertId: string, updates: Partial<JobAlert>) => Promise<void>;
  deleteJobAlert: (alertId: string) => Promise<void>;
  toggleJobAlert: (alertId: string) => Promise<void>;
  
  // Loading states
  isLoading: {
    applications: boolean;
    jobAlerts: boolean;
    savedJobs: boolean;
  };
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [isLoading, setIsLoading] = useState({
    applications: false,
    savedJobs: false,
    jobAlerts: false,
  });

  // Applications Functions
  const loadApplications = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, applications: true }));
    try {
      console.log('🔐 loadApplications: Attempting to get token...');
      console.log('🔐 loadApplications: isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
      
      const token = await getValidToken(getToken, 3);
      console.log('🔐 loadApplications: Token result:', token ? 'Token obtained' : 'No token available');
      
      if (!token) {
        console.warn('Unable to get valid token for applications');
        return;
      }
      
      const response = await fetch('/api/jobs/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else if (response.status === 401) {
        console.warn('Authentication failed for applications, token may be expired');
      } else if (response.status === 404) {
        console.log('User not found in database, attempting to sync user...');
        // Try to sync the user first
        const syncResponse = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (syncResponse.ok) {
          console.log('User synced successfully, retrying applications load...');
          // Retry loading applications after sync
          const retryResponse = await fetch('/api/jobs/applications', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setApplications(data.applications || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, applications: false }));
    }
  }, [getToken, isLoaded, isSignedIn]);

  const applyToJob = useCallback(async (job: Job, notes?: string) => {
    try {
      let token = await getToken();
      
      // If token is null, try again after a short delay (clock skew issue)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }
      
      const response = await fetch('/api/jobs/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job, notes }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(prev => [...prev, data.application]);
      } else if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      throw error;
    }
  }, [getToken, isLoaded, isSignedIn]);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: JobApplication['status']) => {
    try {
      let token = await getToken();
      
      // If token is null, try again after a short delay (clock skew issue)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }
      
      const response = await fetch(`/api/jobs/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status } : app
          )
        );
      } else if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
      throw error;
    }
  }, [getToken, isLoaded, isSignedIn]);

  const hasApplied = useCallback((jobId: string) => {
    return applications.some(app => app.jobId === jobId);
  }, [applications]);

  // Saved Jobs Functions
  const loadSavedJobs = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, savedJobs: true }));
    try {
      const token = await getValidToken(getToken, 3);
      if (!token) {
        console.warn('Unable to get valid token for saved jobs');
        return;
      }
      
      const response = await fetch('/api/jobs/saved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data.jobs || []);
      } else if (response.status === 401) {
        console.warn('Authentication failed for saved jobs, token may be expired');
      }
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, savedJobs: false }));
    }
  }, [getToken, isLoaded, isSignedIn]);

  const saveJob = useCallback(async (job: Job) => {
    try {
      let token = await getToken();
      
      // If token is null, try again after a short delay (clock skew issue)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }
      
      const response = await fetch('/api/jobs/saved', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(prev => [...prev, data.job]);
      } else if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
      throw error;
    }
  }, [getToken, isLoaded, isSignedIn]);

  const unsaveJob = useCallback(async (jobId: string) => {
    try {
      let token = await getToken();
      
      // If token is null, try again after a short delay (clock skew issue)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }
      
      const response = await fetch(`/api/jobs/saved/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        setSavedJobs(prev => prev.filter(savedJob => {
          const savedJobId = savedJob.id || savedJob.url || `${savedJob.company}-${savedJob.title}`;
          return savedJobId !== jobId;
        }));
      } else if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
      }
    } catch (error) {
      console.error('Failed to unsave job:', error);
      throw error;
    }
  }, [getToken, isLoaded, isSignedIn]);

  const isSaved = useCallback((jobId: string) => {
    return savedJobs.some(savedJob => {
      const savedJobId = savedJob.id || savedJob.url || `${savedJob.company}-${savedJob.title}`;
      return savedJobId === jobId;
    });
  }, [savedJobs]);

  // Job Alerts Functions
  const loadJobAlerts = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, jobAlerts: true }));
    try {
      const token = await getValidToken(getToken, 3);
      if (!token) {
        console.warn('Unable to get valid token for job alerts');
        return;
      }
      
      const response = await fetch('/api/jobs/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setJobAlerts(data.alerts || []);
      } else if (response.status === 401) {
        console.warn('Authentication failed for job alerts, token may be expired');
      } else if (response.status === 404) {
        console.log('User not found in database, attempting to sync user...');
        // Try to sync the user first
        const syncResponse = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (syncResponse.ok) {
          console.log('User synced successfully, retrying job alerts load...');
          // Retry loading job alerts after sync
          const retryResponse = await fetch('/api/jobs/alerts', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setJobAlerts(data.alerts || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load job alerts:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, jobAlerts: false }));
    }
  }, [getToken, isLoaded, isSignedIn]);

  const createJobAlert = useCallback(async (alertData: Omit<JobAlert, 'id' | 'createdDate' | 'newMatches'>) => {
    try {
      let token = await getToken();
      
      // If token is null, try again after a short delay (clock skew issue)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }
      
      const response = await fetch('/api/jobs/alerts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(alertData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobAlerts(prev => [...prev, data.alert]);
      } else if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
      }
    } catch (error) {
      console.error('Failed to create job alert:', error);
      throw error;
    }
  }, [getToken, isLoaded, isSignedIn]);

  const updateJobAlert = useCallback(async (alertId: string, updates: Partial<JobAlert>) => {
    try {
      let token = await getToken();
      
      // If token is null, try again after a short delay (clock skew issue)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }
      
      const response = await fetch(`/api/jobs/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        setJobAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId ? { ...alert, ...updates } : alert
          )
        );
      } else if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
      }
    } catch (error) {
      console.error('Failed to update job alert:', error);
      throw error;
    }
  }, [getToken, isLoaded, isSignedIn]);

  const deleteJobAlert = useCallback(async (alertId: string) => {
    try {
      let token = await getToken();
      
      // If token is null, try again after a short delay (clock skew issue)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        token = await getToken();
      }
      
      const response = await fetch(`/api/jobs/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        setJobAlerts(prev => prev.filter(alert => alert.id !== alertId));
      } else if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
      }
    } catch (error) {
      console.error('Failed to delete job alert:', error);
      throw error;
    }
  }, [getToken, isLoaded, isSignedIn]);

  const toggleJobAlert = useCallback(async (alertId: string) => {
    const alert = jobAlerts.find(a => a.id === alertId);
    if (alert) {
      await updateJobAlert(alertId, { isActive: !alert.isActive });
    }
  }, [jobAlerts, updateJobAlert]);

  // Load initial data only when user is authenticated with robust token validation
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      // Add initial delay to let Clerk fully initialize
      await exponentialBackoff(0, 1000);

      // Validate token before making API calls
      const token = await getValidToken(getToken, 3);
      if (!token) {
        console.warn('Unable to get valid token, skipping initial data load');
        return;
      }

      console.log('Token validated, loading initial job data...');
      
      // Load data with error handling
      try {
        await Promise.allSettled([
          loadApplications(),
          loadSavedJobs(),
          loadJobAlerts()
        ]);
      } catch (error) {
        console.error('Error loading initial job data:', error);
      }
    };

    loadInitialData();
  }, [isLoaded, isSignedIn, getToken, loadApplications, loadSavedJobs, loadJobAlerts]);

  const value: JobContextType = {
    applications,
    applyToJob,
    updateApplicationStatus,
    hasApplied,
    savedJobs,
    saveJob,
    unsaveJob,
    isSaved,
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
