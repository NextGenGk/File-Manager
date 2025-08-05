import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateConfig } from '@/lib/config';
import { withSecurityHeaders, withCORS, withRateLimit } from '@/lib/security-middleware';
import { logger } from '@/lib/error-handling';

// Validate configuration on startup
validateConfig();

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/oauth-callback(.*)',
  '/auth/callback(.*)',
  '/api/auth-test',
  '/api/webhooks(.*)',
  '/api/health',
]);

// Use the correct Clerk middleware pattern
export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Exit early if pathname is not available
  if (!request.nextUrl?.pathname) {
    return NextResponse.next();
  }

  const startTime = Date.now();

  try {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files and internal Next.js routes
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/_') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Explicitly allow SSO callback routes without any restrictions
    if (
      pathname.startsWith('/sso-callback') ||
      pathname.startsWith('/oauth-callback') ||
      pathname.startsWith('/auth/callback')
    ) {
      console.log(`🔓 Allowing unrestricted access to SSO callback route: ${pathname}`);
      return NextResponse.next();
    }

    // Check if the route is public
    if (!isPublicRoute(request)) {
      // For protected routes, ensure user is authenticated
      const { userId } = await auth();
      if (!userId) {
        // For API routes, return JSON error instead of redirect
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }
        // For page routes, redirect to sign-in
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }

    // Create response
    let response = NextResponse.next();

    // Apply security headers
    response = withSecurityHeaders(response);

    // Apply CORS for API routes
    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin');

      // Apply rate limiting to API routes
      const rateLimitCheck = withRateLimit(request);
      if (!rateLimitCheck.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: rateLimitCheck.error || 'Too many requests',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Set CORS headers using helper function
      response = withCORS(response, origin || undefined);
    }

    // Log request in production
    if (process.env.NODE_ENV === 'production') {
      const duration = Date.now() - startTime;
      logger.info('Request processed', {
        action: 'request_processed',
        metadata: {
          method: request.method,
          path: pathname,
          duration,
        },
      });
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorObj = error instanceof Error ? error : new Error('Unknown middleware error');
    logger.error('Middleware error', errorObj, {
      action: 'middleware_error',
      metadata: {
        pathname: request?.nextUrl?.pathname ?? 'unknown',
        duration
      }
    });

    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
