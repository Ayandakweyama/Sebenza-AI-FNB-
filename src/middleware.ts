import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = ['/', '/about', '/pricing'];

// Auth paths that should be handled by Next.js routing
const authPaths = ['/sign-in', '/sign-up'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log the request for debugging
  console.log(`[Middleware] Request to: ${pathname}`);
  
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
  // In a real app, you would check for authentication here
  console.log(`Proceeding with request to: ${pathname}`);
  return NextResponse.next();
}

// Match all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
