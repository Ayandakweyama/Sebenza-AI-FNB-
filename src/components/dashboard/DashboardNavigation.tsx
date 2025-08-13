'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardNavigationProps {
  title?: string;
  description?: string;
  backLink?: string;
  backText?: string;
}

export default function DashboardNavigation({ 
  title, 
  description, 
  backLink = '/dashboard', 
  backText = 'Back to Dashboard' 
}: DashboardNavigationProps) {
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean) || [];
  
  // Don't show on dashboard landing page
  if (pathname === '/dashboard') return null;

  // Generate breadcrumbs
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      href,
      label: index === segments.length - 1 ? (
        <span className="text-white">{label}</span>
      ) : (
        <Link href={href} className="hover:text-white transition-colors">
          {label}
        </Link>
      ),
      isLast: index === segments.length - 1
    };
  });

  return (
    <>
      {/* Breadcrumbs */}
      <div className="mb-2">
        <div className="text-sm text-slate-500">
          {breadcrumbs.map((breadcrumb, index) => (
            <span key={breadcrumb.href}>
              {breadcrumb.label}
              {!breadcrumb.isLast && <span className="mx-2">/</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Page Header */}
      {(title || description) && (
        <div className="mb-6 sm:mb-8">
          {title && <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>}
          {description && <p className="text-lg text-slate-400">{description}</p>}
        </div>
      )}
      
      {/* Back Button - Moved lower */}
      <div className="mb-8 sm:mb-10">
        <Link 
          href={backLink}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {backText}
        </Link>
      </div>
    </>
  );
}
