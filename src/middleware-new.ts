import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/scrape-fallback(.*)',
  '/api/jobs/quick-search(.*)',
  '/api/analyze-job-post(.*)',
  '/api/afrigter(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }
  
  // Protect all other routes (including API routes)
  auth().protect();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).+)", "/(api|trpc)(.*)"],
};
