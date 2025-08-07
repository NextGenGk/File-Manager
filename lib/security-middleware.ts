/**
 * Production Security Middleware (without rate limiting)
 */

import { NextRequest, NextResponse } from 'next/server'
import { config, isProduction } from './config'

/**
 * Security headers middleware
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.kapoorabeer.me https://*.clerk.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.kapoorabeer.me https://*.clerk.com",
    "frame-src https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.kapoorabeer.me https://*.clerk.com"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  return response
}

/**
 * Request validation middleware
 */
export function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  // Check for required headers
  const contentType = request.headers.get('content-type')
  const method = request.method

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return {
        valid: false,
        error: 'Invalid content type. Expected application/json or multipart/form-data'
      }
    }
  }

  // Validate request size (basic check)
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > config.upload.maxFileSize) {
    return {
      valid: false,
      error: `Request too large. Maximum size: ${config.upload.maxFileSize} bytes`
    }
  }

  return { valid: true }
}

/**
 * CORS middleware for API routes
 */
export function withCORS(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    config.APP_URL,
    'http://localhost:3000',
    'http://localhost:3001'
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (!isProduction) {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

/**
 * Rate limiting middleware (simplified for production)
 */
export function withRateLimit(): { allowed: boolean; error?: string } {
  // In production, you might want to implement Redis-based rate limiting
  // For now, this is a basic implementation
  
  // Basic rate limiting logic (you can enhance this)
  return { allowed: true }
}
