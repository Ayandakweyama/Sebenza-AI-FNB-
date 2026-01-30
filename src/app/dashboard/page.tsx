'use client';

import { DashboardProvider } from '@/app/components/dashboard/context/DashboardContext';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { ChatbotProvider } from '@/app/components/dashboard/ChatbotProvider';
import { LoadingSpinner } from '@/app/components/dashboard/LoadingSpinner';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [showLoading, setShowLoading] = useState(true);

  // Minimum loading time to show the spinner (1.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle auth redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth OR during minimum loading time
  if (!isLoaded || showLoading) {
    return <LoadingSpinner message="" variant="default" />;
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
