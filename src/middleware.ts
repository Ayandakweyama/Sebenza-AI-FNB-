import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = ['/', '/about', '/pricing'];

// Auth paths that should be handled by Next.js routing
const authPaths = ['/sign-in', 'sign-up'];

// List of AI/MongoDB dependent routes to disable
const disabledRoutes = [
  '/api/afrigter',
  '/api/ai',
  '/api/analyze-job-post',
  '/api/scrape-jobs',
  '/api/scrape-careerjunction',
  '/api/tasks',
  '/afrigter',
  '/career-roadmap',
  '/resume-analyzer'
];

// Function to check if a path should be disabled
function isDisabledRoute(pathname: string): boolean {
  return disabledRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log the request for debugging
  console.log(`[Middleware] Request to: ${pathname}`);
  
  // Block disabled routes
  if (isDisabledRoute(pathname)) {
    console.log(`Blocking disabled route: ${pathname}`);
    return new NextResponse(
      JSON.stringify({ 
        error: 'This feature is temporarily disabled for deployment' 
      }), 
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  // Allow all public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    console.log(`Allowing access to public path: ${pathname}`);
    return NextResponse.next();
  }
  
  // Handle auth paths - let Next.js routing handle these
  if (authPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    console.log(`Allowing access to auth path: ${pathname}`);
    return NextResponse.next();
  }
  
  // For all other paths, just continue
  console.log(`Proceeding with request to: ${pathname}`);
  return NextResponse.next();
}

// Match all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
