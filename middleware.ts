import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/auth-test',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // For protected routes, redirect to sign-in if not authenticated
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // This will redirect to sign-in page
      return Response.redirect(new URL('/sign-in', req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|static|.*\\.(?:jpg|jpeg|gif|png|svg|ico)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
