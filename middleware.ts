import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { validateConfig } from '@/lib/config';
import { withSecurityHeaders, withCORS } from '@/lib/security-middleware';
import { logger } from '@/lib/error-handling';

// Validate configuration on startup
validateConfig();

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/auth-test',
  '/api/webhooks(.*)',
]);

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const startTime = Date.now();

  try {
    // Skip middleware for static files and internal Next.js routes
    if (
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/api/_') ||
      request.nextUrl.pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Create response
    let response = NextResponse.next();

    // Apply security headers
    response = withSecurityHeaders(response);

    // Apply CORS for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin');
      response = withCORS(response, origin || undefined);
    }

    // Continue with Clerk middleware for auth
    return clerkMiddleware(async (auth, req) => {
      // Public routes don't need authentication
      if (isPublicRoute(req)) return response;

      // Protect all other routes
      const authObj = await auth();
      if (!authObj.userId) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
      return response;
    })(request, event);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorObj = error instanceof Error ? error : new Error('Unknown middleware error');
    logger.error('Middleware error', errorObj, {
      metadata: {
        pathname: request.nextUrl.pathname,
        duration
      }
    });

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
