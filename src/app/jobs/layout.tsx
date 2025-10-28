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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Added spacer to push content down */}
        <div className="h-16"></div>
        
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
            Job Portal
          </h1>
          <p className="text-purple-200 text-lg text-center">Find and manage your career opportunities in one place</p>
        </div>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.name}
                href={item.href}
                className={`group block p-6 rounded-2xl border transition-colors duration-200 ${
                  isActive(item.href) 
                    ? 'bg-slate-800/80 border-purple-500/50' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50'
                } backdrop-blur-sm`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <p className="text-sm text-purple-200">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
          {children}
        </div>
      </div>
    </div>
  );
}
