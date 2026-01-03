import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/navbar/Navbar";
import RemoveExtensionAttributes from "./components/RemoveExtensionAttributes";
import PageLoader from "@/components/ui/PageLoader";

// Temporarily disable Google Fonts to fix Turbopack issue
// import { Geist, Geist_Mono } from "next/font/google";

// Use system fonts as fallback
const geistSans = {
  variable: "--font-geist-sans",
  className: "font-sans"
};

const geistMono = {
  variable: "--font-geist-mono", 
  className: "font-mono"
};

export const metadata: Metadata = {
  title: {
    default: 'Sebenza AI',
    template: '%s | Sebenza AI',
  },
  description: 'AI-Powered Career Acceleration Platform',
  keywords: ['Job Search', 'Career', 'AI', 'Resume Builder', 'ATS'],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body 
        className="min-h-screen bg-slate-950 text-gray-200"
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <PageLoader>
                {children}
              </PageLoader>
            </main>
          </div>
        </Providers>
        <RemoveExtensionAttributes />
      </body>
    </html>
  );
}


