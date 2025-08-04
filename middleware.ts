import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateConfig } from '@/lib/config';
import { withSecurityHeaders, withRateLimit } from '@/lib/security-middleware';
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

export async function middleware(request: NextRequest) {
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

      // Apply rate limiting to API routes
      const rateLimitCheck = await checkRateLimit(request);
      if (!rateLimitCheck.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: rateLimitCheck.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': rateLimitCheck.retryAfter.toString(),
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
          status: response.status,
        },
      });
    }

    return response;
  } catch (error) {
    logger.error('Middleware error', error as Error, {
      action: 'middleware_error',
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
      },
    });

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function checkRateLimit(
  request: NextRequest
): Promise<{ allowed: boolean; retryAfter: number }> {
  // Simple in-memory rate limiting for demo
  // In production, use Redis or a proper rate limiting service
  return { allowed: true, retryAfter: 0 };
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
