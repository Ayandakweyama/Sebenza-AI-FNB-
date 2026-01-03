'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';

// Metadata must be defined in a server component
// Moved to page.tsx files in the jobs directory

const navItems = [
  {
    name: 'All Jobs',
    href: '/jobs/all',
    icon: Briefcase,
    description: 'Browse all available job opportunities'
  },
];

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if current route matches the nav item
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a 
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-5 w-5 mr-2" aria-hidden="true">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Back to Dashboard
          </a>
        </div>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
            Job Portal
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-2 sm:px-0">
            Find and manage your career opportunities in one place with AI-powered job matching.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-slate-700/50">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
