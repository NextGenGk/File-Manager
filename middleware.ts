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
  '/api/health',
]);

<<<<<<< HEAD
export default clerkMiddleware(async (auth, request: NextRequest) => {
=======
export async function middleware(request: NextRequest, event: NextFetchEvent) {
>>>>>>> 4c7427516ec379efe95f6307e1a1240940f103a6
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

    // Check if the route is public
    if (!isPublicRoute(request)) {
      // For protected routes, ensure user is authenticated
      const { userId } = await auth();
      if (!userId) {
        // For API routes, return JSON error instead of redirect
        if (request.nextUrl.pathname.startsWith('/api/')) {
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
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin');
<<<<<<< HEAD

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

      // Set CORS headers
      if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-API-Key'
      );
    }

    // Log request in production
    if (process.env.NODE_ENV === 'production') {
      const duration = Date.now() - startTime;
      logger.info('Request processed', {
        action: 'request_processed',
        metadata: {
          method: request.method,
          path: request.nextUrl.pathname,
          duration,
        },
      });
    }
=======
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
>>>>>>> 4c7427516ec379efe95f6307e1a1240940f103a6

  } catch (error) {
<<<<<<< HEAD
    logger.error('Middleware error', {
      action: 'middleware_error',
      error: error instanceof Error ? error.message : 'Unknown error',
=======
    const duration = Date.now() - startTime;
    const errorObj = error instanceof Error ? error : new Error('Unknown middleware error');
    logger.error('Middleware error', errorObj, {
>>>>>>> 4c7427516ec379efe95f6307e1a1240940f103a6
      metadata: {
        pathname: request.nextUrl.pathname,
        duration
      }
    });

<<<<<<< HEAD
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
=======
    return NextResponse.next();
  }
}
>>>>>>> 4c7427516ec379efe95f6307e1a1240940f103a6

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
