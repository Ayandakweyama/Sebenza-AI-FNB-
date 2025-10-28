import { auth, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/',
  '/about',
  '/pricing',
  '/api/webhooks/clerk',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)'
];

// List of routes to disable (removed afrigter and analyze-job-post as they should work)
const disabledRoutes = [
  '/api/ai',
  '/career-roadmap',
  '/resume-analyzer',
  '/applications'
];

// Create route matchers
const isPublicRoute = createRouteMatcher(publicPaths);
const isDisabledRoute = createRouteMatcher(disabledRoutes);

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Handle disabled routes
  if (isDisabledRoute(req)) {
    return NextResponse.json(
      { error: 'This feature is currently disabled due to high demand. Please check back later.' },
      { status: 503 }
    );
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If user is not signed in and the route is not public, redirect to sign-in
  if (!session.userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

// Configure which routes to protect
export const config = {
  matcher: [
    // Match all routes except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Include API routes
    '/api/:path*'
  ]
};
