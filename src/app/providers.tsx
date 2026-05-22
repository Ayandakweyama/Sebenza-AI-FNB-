'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";
import { JobProvider } from "../contexts/JobContext";
import { ProfileProvider } from "../contexts/ProfileContext";
import { UserSync } from "@/components/auth/UserSync";
import AppToaster from "@/components/ui/AppToaster";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

function ProvidersContent({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <ProfileProvider>
        <JobProvider>
          {children}
        </JobProvider>
      </ProfileProvider>
    </DashboardProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#3b82f6" },
      }}
      // Updated to use new prop names
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <UserSync>
        <ProvidersContent>
          {children}
        </ProvidersContent>
        <AppToaster />
        <PwaInstallPrompt />
        <ServiceWorkerRegister />
      </UserSync>
    </ClerkProvider>
  );
}
