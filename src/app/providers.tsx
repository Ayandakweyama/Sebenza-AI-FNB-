'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";
import { JobProvider } from "@/contexts/JobContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#3b82f6" },
      }}
    >
      <DashboardProvider>
        <JobProvider>
          {children}
        </JobProvider>
      </DashboardProvider>
    </ClerkProvider>
  );
}
