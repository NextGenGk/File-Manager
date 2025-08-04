/**
 * Production-Ready Error Handling and Logging System
 */

import { config, isProduction } from './config'

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string
  requestId?: string
  action?: string
  metadata?: Record<string, any>
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    this.logLevel = isProduction ? LogLevel.INFO : LogLevel.DEBUG
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    return levels.indexOf(level) <= levels.indexOf(this.logLevel)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const errorDetails = error ? ` | Error: ${error.message} | Stack: ${error.stack}` : ''
    const logMessage = this.formatMessage(LogLevel.ERROR, message + errorDetails, context)

    console.error(logMessage)

    // In production, send to monitoring service
    if (isProduction && config.monitoring.sentryDsn) {
      this.sendToSentry(message, error, context)
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    console.warn(this.formatMessage(LogLevel.WARN, message, context))
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    console.info(this.formatMessage(LogLevel.INFO, message, context))
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    console.log(this.formatMessage(LogLevel.DEBUG, message, context))
  }

  private async sendToSentry(message: string, error?: Error, context?: LogContext): Promise<void> {
    try {
      // This would integrate with Sentry in production
      // For now, we'll just log to console in a structured format
      console.error('SENTRY_LOG:', {
        message,
        error: error?.message,
        stack: error?.stack,
        context,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to send error to Sentry:', err)
    }
  }
}

export const logger = new Logger()

/**
 * Production Error Classes
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: LogContext

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: LogContext
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: LogContext) {
    super(message, 400, true, context)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: LogContext) {
    super(message, 401, true, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: LogContext) {
    super(message, 403, true, context)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: LogContext) {
    super(`${resource} not found`, 404, true, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: LogContext) {
    super(message, 429, true, context)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, context?: LogContext) {
    super(message || `External service ${service} is unavailable`, 503, true, context)
  }
}

/**
 * Error Handler for API Routes
 */
export function handleApiError(error: Error, context?: LogContext): Response {
  logger.error('API Error occurred', error, context)

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        statusCode: error.statusCode,
        ...(context && { context })
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Handle unexpected errors
  const statusCode = isProduction ? 500 : 500
  const message = isProduction ? 'Internal server error' : error.message

  return new Response(
    JSON.stringify({
      error: message,
      statusCode,
      ...(context && { context })
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Async Error Handler Wrapper
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      logger.error('Async operation failed', error as Error)
      throw error
    }
  }
}
