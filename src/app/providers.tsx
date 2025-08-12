'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#3b82f6" },
      }}
    >
      <DashboardProvider>
        {children}
      </DashboardProvider>
    </ClerkProvider>
  );
}
