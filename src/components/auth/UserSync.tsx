'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

export function UserSync({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [isSynced, setIsSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user || isSynced || isSyncing) {
        return;
      }

      // Wait a bit for Clerk to fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSyncing(true);
      
      try {
        console.log('Initiating user sync...');
        const token = await getToken();
        
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
        }
      } catch (error) {
        console.error('Error syncing user:', error);
        toast.error('Error syncing user data. Please refresh the page.');
      } finally {
        setIsSyncing(false);
      }
    };

    if (isLoaded && isSignedIn) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user, isSynced, isSyncing, getToken]);

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
