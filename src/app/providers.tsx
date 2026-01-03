'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";
import { JobProvider } from "../contexts/JobContext";
import { ProfileProvider } from "../contexts/ProfileContext";
import { UserSync } from "@/components/auth/UserSync";

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
      </UserSync>
    </ClerkProvider>
  );
}
