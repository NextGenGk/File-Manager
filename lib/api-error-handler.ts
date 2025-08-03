import { NextResponse } from 'next/server'

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  details?: Record<string, unknown>
}

export class ApiErrorHandler {
  static handle(error: unknown): NextResponse {
    console.error('API Error:', error)

    // Handle known error types
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: process.env.NODE_ENV === 'development' ? error.details : undefined,
        },
        { status: error.statusCode }
      )
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 400 }
      )
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.toLowerCase().includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Handle rate limiting
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Generic error fallback
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    )
  }

  static createError(message: string, statusCode: number, code?: string, details?: Record<string, unknown>): ApiError {
    return {
      message,
      statusCode,
      code,
      details,
    }
  }
}

// Custom error classes for different scenarios
export class ValidationError extends Error {
  constructor(message: string) {
    super(`Validation error: ${message}`)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}
