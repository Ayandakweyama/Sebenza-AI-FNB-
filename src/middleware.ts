import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/scrape-fallback(.*)',
  '/api/scrape-multi',
  '/api/jobs/quick-search(.*)',
  '/api/analyze-job-post(.*)',
  '/api/afrigter(.*)',
  '/api/jobs/applications(.*)',
  '/api/jobs/alerts(.*)',
  '/api/jobs/saved(.*)',
  '/api/profile(.*)',
  '/api/auth/(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }
  
  // For protected page routes, ensure user is authenticated
  auth();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).+)", "/(api|trpc)(.*)"],
};
