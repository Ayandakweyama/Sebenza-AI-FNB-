'use client';

import { DashboardProvider } from '@/app/components/dashboard/context/DashboardContext';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { ChatbotProvider } from '@/app/components/dashboard/ChatbotProvider';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // Handle auth redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Sync user with database (temporarily disabled due to auth issues)
  // useEffect(() => {
  //   if (isSignedIn && user) {
  //     fetch('/api/auth/sync-user', {
  //       method: 'POST',
  //     }).catch(error => {
  //       console.error('Failed to sync user:', error);
  //     });
  //   }
  // }, [isSignedIn, user]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  // Only render dashboard if signed in
  if (isSignedIn) {
    return (
      <DashboardProvider user={user}>
        <DashboardLayout />
        <ChatbotProvider />
      </DashboardProvider>
    );
  }

  // If not signed in, we'll be redirected by the useEffect
  return null;
}
