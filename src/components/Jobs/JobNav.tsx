'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Bookmark, Clock, Bell } from 'lucide-react';

const navigation = [
  { name: 'All Jobs', href: '/jobs/all', icon: Briefcase },
  { name: 'Saved Jobs', href: '/jobs/saved', icon: Bookmark },
  { name: 'Applications', href: '/jobs/applications', icon: Clock },
  { name: 'Job Alerts', href: '/jobs/alerts', icon: Bell },
];

export function JobNav() {
  const pathname = usePathname();
  
  return (
    <nav className="border-b border-gray-200">
      <ul className="flex space-x-8">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                         (item.href !== '/jobs/all' && pathname?.startsWith(item.href));
          
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
