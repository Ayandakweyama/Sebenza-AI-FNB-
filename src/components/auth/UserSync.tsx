'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { getValidToken } from '@/utils/authHelpers';

export function UserSync({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [isSynced, setIsSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAttempted = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const lastSyncStorageKey = 'sebenza:lastUserSyncAt';
  const minSyncIntervalMs = 10 * 60 * 1000;

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user || isSynced || isSyncing || syncAttempted.current) {
        return;
      }

      const last = Number(localStorage.getItem(lastSyncStorageKey) || 0);
      if (last && Date.now() - last < minSyncIntervalMs) {
        setIsSynced(true);
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
        // Use robust token validation with retries
        const token = await getValidToken(getToken, maxRetries);
        
        if (!token) {
          toast.error('Authentication failed. Please refresh the page.');
          return;
        }
        
        const makeSyncRequest = async (url: string) =>
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            credentials: 'same-origin'
          });

        let response = await makeSyncRequest('/api/user/sync');
        if (response.status === 404) {
          response = await makeSyncRequest('/api/auth/sync-user');
        }

        const responseData = await response.json().catch(() => ({}));
        
        if (response.ok) {
          setIsSynced(true);
          localStorage.setItem(lastSyncStorageKey, `${Date.now()}`);
          retryCount.current = 0; // Reset retry count on success
        } else if (response.status === 401) {
          // Reset sync attempt so it can retry with a fresh token
          syncAttempted.current = false;
          retryCount.current += 1;
          
          if (retryCount.current < maxRetries) {
            setTimeout(() => {
              syncAttempted.current = false;
            }, Math.pow(2, retryCount.current - 1) * 1000);
          } else {
            toast.error('Failed to sync user after multiple attempts. Please refresh the page.');
          }
        } else {
          const errorMessage = responseData.error?.message || responseData.details || 'Unknown error';
          toast.error(`Failed to sync user: ${errorMessage}`);
          
          // Reset sync attempt on failure so it can retry
          syncAttempted.current = false;
        }
      } catch (error) {
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
    const retryInterval = setInterval(retrySync, 5 * 60 * 1000);

    return () => {
      clearInterval(retryInterval);
    };
  }, [isLoaded, isSignedIn, user, isSynced, getToken]); // Removed isSyncing to prevent infinite loop

  return <>{children}</>;
}
