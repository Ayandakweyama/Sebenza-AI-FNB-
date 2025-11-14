'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Bookmark, Clock, Bell } from 'lucide-react';

// Metadata must be defined in a server component
// Moved to page.tsx files in the jobs directory

const navItems = [
  {
    name: 'All Jobs',
    href: '/jobs/all',
    icon: Briefcase,
    description: 'Browse all available job opportunities'
  },
  {
    name: 'Saved Jobs',
    href: '/jobs/saved',
    icon: Bookmark,
    description: 'View your saved job listings'
  },
  {
    name: 'Applications',
    href: '/jobs/applications',
    icon: Clock,
    description: 'Track your job applications'
  },
  {
    name: 'Job Alerts',
    href: '/jobs/alerts',
    icon: Bell,
    description: 'Manage your job alerts'
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
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
            Job Portal
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-2 sm:px-0">
            Find and manage your career opportunities in one place with AI-powered job matching.
          </p>
        </div>
      </section>

      {/* Navigation Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group block p-4 sm:p-6 rounded-2xl border transition-all duration-300 transform hover:scale-105 relative overflow-hidden min-h-[140px] sm:min-h-[160px] flex flex-col ${
                    isActive(item.href)
                      ? 'bg-gradient-to-br from-pink-500/10 via-pink-600/10 to-purple-600/10 backdrop-blur-sm border-pink-500/50 shadow-2xl shadow-pink-500/25'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-500/25'
                  }`}
                >
                  {/* Pink gradient accent line for active/hover */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600 transition-opacity duration-300 ${
                    isActive(item.href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}></div>

                  <div className="text-center flex-1 flex flex-col justify-center">
                    {/* Icon Container */}
                    <div className="relative mx-auto mb-4 sm:mb-6">
                      <div className={`w-20 h-20 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center transition-all duration-300 ${
                        isActive(item.href)
                          ? 'from-pink-500/20 to-pink-600/20 border-2 border-pink-500/40 shadow-lg shadow-pink-500/30'
                          : 'from-pink-500/20 to-pink-600/20 border-2 border-pink-500/30 group-hover:border-pink-400/60 group-hover:shadow-lg group-hover:shadow-pink-500/30'
                      }`}>
                        <Icon className={`w-10 h-10 sm:w-8 sm:h-8 transition-colors duration-300 ${
                          isActive(item.href)
                            ? 'text-pink-400'
                            : 'text-pink-400 group-hover:text-pink-300'
                        }`} />
                      </div>
                      {/* Decorative ring with pink */}
                      <div className={`absolute inset-0 w-20 h-20 sm:w-16 sm:h-16 mx-auto rounded-2xl border animate-pulse ${
                        isActive(item.href) ? 'border-pink-500/40' : 'border-pink-500/20'
                      }`}></div>
                      {/* Pink glow effect */}
                      <div className={`absolute inset-0 w-20 h-20 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-pink-500/0 transition-all duration-300 ${
                        isActive(item.href) ? 'bg-pink-500/5' : 'group-hover:bg-pink-500/10'
                      }`}></div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className={`text-lg sm:text-xl font-bold transition-colors duration-300 leading-tight ${
                        isActive(item.href)
                          ? 'text-pink-100'
                          : 'text-white group-hover:text-pink-100'
                      }`}>
                        {item.name}
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed transition-colors duration-300 px-2 sm:px-0 ${
                        isActive(item.href)
                          ? 'text-pink-200'
                          : 'text-gray-400 group-hover:text-gray-300'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
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
