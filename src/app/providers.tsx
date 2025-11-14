'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";
import { JobProvider } from "@/contexts/JobContext";
import { useUser } from "@clerk/nextjs";

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  return (
    <DashboardProvider user={user}>
      <JobProvider>
        {children}
      </JobProvider>
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
    >
      <ProvidersContent>
        {children}
      </ProvidersContent>
    </ClerkProvider>
  );
}
