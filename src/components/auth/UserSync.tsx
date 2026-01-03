'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { getValidToken, exponentialBackoff } from '@/utils/authHelpers';

export function UserSync({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [isSynced, setIsSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttempted = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user || isSynced || isSyncing || syncAttempted.current) {
        return;
      }

      // Add longer initial delay to let Clerk fully initialize
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Double-check authentication state after delay
      if (!isLoaded || !isSignedIn || !user) {
        console.log('Authentication state changed during delay, aborting sync');
        syncAttempted.current = false;
        return;
      }

      syncAttempted.current = true;
      setIsSyncing(true);
      
      try {
        console.log('Initiating user sync...');
        
        // Use robust token validation with retries
        const token = await getValidToken(getToken, maxRetries);
        
        if (!token) {
          console.warn('Failed to get valid token after all retries');
          toast.error('Authentication failed. Please refresh the page.');
          return;
        }
        
        console.log('Token obtained successfully, making API call...');
        
        const response = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'same-origin'
        });

        const responseData = await response.json().catch(() => ({}));
        
        if (response.ok) {
          console.log('User synced successfully:', responseData.user);
          setIsSynced(true);
          retryCount.current = 0; // Reset retry count on success
        } else if (response.status === 401) {
          console.warn('Authentication failed during sync, token may be expired');
          // Reset sync attempt so it can retry with a fresh token
          syncAttempted.current = false;
          retryCount.current += 1;
          
          if (retryCount.current < maxRetries) {
            // Use exponential backoff for retry
            const delay = await exponentialBackoff(retryCount.current - 1, 1000);
            console.log(`Retrying sync in ${delay}ms (attempt ${retryCount.current}/${maxRetries})`);
            setTimeout(() => {
              syncAttempted.current = false;
            }, delay);
          } else {
            console.error('Max retries reached for user sync');
            toast.error('Failed to sync user after multiple attempts. Please refresh the page.');
          }
        } else {
          console.error('Failed to sync user. Status:', response.status, 'Response:', responseData);
          const errorMessage = responseData.error?.message || responseData.details || 'Unknown error';
          toast.error(`Failed to sync user: ${errorMessage}`);
          
          console.log('User state:', { 
            isLoaded, 
            isSignedIn, 
            userId: user?.id,
            isSynced,
            isSyncing,
            hasToken: !!token
          });
          
          // Reset sync attempt on failure so it can retry
          syncAttempted.current = false;
        }
      } catch (error) {
        console.error('Error syncing user:', error);
        toast.error('Error syncing user data. Please refresh the page.');
        // Reset sync attempt on error so it can retry
        syncAttempted.current = false;
      } finally {
        setIsSyncing(false);
      }
    };

    // Add a periodic retry mechanism for failed syncs
    const retrySync = () => {
      if (isLoaded && isSignedIn && user && !isSynced && !isSyncing && !syncAttempted.current) {
        syncUser();
      }
    };

    // Initial sync
    if (isLoaded && isSignedIn) {
      syncUser();
    }

    // Set up periodic retry every 30 seconds if sync failed
    const retryInterval = setInterval(retrySync, 30000);

    return () => {
      clearInterval(retryInterval);
    };
  }, [isLoaded, isSignedIn, user, isSynced, getToken]); // Removed isSyncing to prevent infinite loop

  // Show loading state while syncing
  if (isSignedIn && isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Syncing user data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
