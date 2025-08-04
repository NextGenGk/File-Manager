/**
 * Production Configuration Management
 * Centralizes all environment variables with validation and defaults
 */

export interface AppConfig {
  // Environment
  NODE_ENV: string
  PORT: number
  APP_URL: string

  // Database
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }

  // Authentication
  clerk: {
    publishableKey: string
    secretKey: string
    webhookSecret?: string
  }

  // AWS S3
  aws: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
  }

  // Security
  security: {  // Define specific properties instead of empty object
    jwtSecret: string
    // Removed encryptionKey as it's not used anywhere in the codebase
  }

  // Rate Limiting
  rateLimit: {
    max: number
    windowMs: number
  }

  // File Upload
  upload: {
    maxFileSize: number
    maxFilesPerUser: number
  }

  // Monitoring
  monitoring: {
    sentryDsn?: string
    analyticsId?: string
  }
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`)
    this.name = 'ConfigurationError'
  }
}

function validateRequired(value: string | undefined, name: string): string {
  if (!value) {
    throw new ConfigurationError(`${name} is required but not provided`)
  }
  return value
}

function getNumberEnv(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (!value) return defaultValue
  const num = parseInt(value, 10)
  if (isNaN(num)) {
    throw new ConfigurationError(`${name} must be a valid number`)
  }
  return num
}

export const config: AppConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: getNumberEnv('PORT', 3001),
  APP_URL: process.env.APP_URL || 'http://localhost:3001',

  supabase: {
    url: validateRequired(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: validateRequired(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: validateRequired(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY'),
  },

  clerk: {
    publishableKey: validateRequired(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
    secretKey: validateRequired(process.env.CLERK_SECRET_KEY, 'CLERK_SECRET_KEY'),
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: validateRequired(process.env.AWS_ACCESS_KEY_ID, 'AWS_ACCESS_KEY_ID'),
    secretAccessKey: validateRequired(process.env.AWS_SECRET_ACCESS_KEY, 'AWS_SECRET_ACCESS_KEY'),
    bucketName: validateRequired(process.env.AWS_S3_BUCKET_NAME, 'AWS_S3_BUCKET_NAME'),
  },

  security: {
    // Security configuration
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-for-development-only',
  },

  rateLimit: {
    max: getNumberEnv('RATE_LIMIT_MAX', 100),
    windowMs: getNumberEnv('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  },

  upload: {
    maxFileSize: getNumberEnv('MAX_FILE_SIZE', 104857600), // 100MB
    maxFilesPerUser: getNumberEnv('MAX_FILES_PER_USER', 1000),
  },

  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    analyticsId: process.env.ANALYTICS_ID,
  },
}

// Validate configuration on module load
export function validateConfig(): void {
  try {
    // Validate URLs
    try {
      new URL(config.supabase.url)
      new URL(config.APP_URL)
    } catch {
      throw new ConfigurationError('Invalid URL format in configuration')
    }

    console.log('✅ Configuration validated successfully')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error'
    console.error('❌ Configuration validation failed:', errorMessage)
    if (config.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}

export const isDevelopment = config.NODE_ENV === 'development'
export const isProduction = config.NODE_ENV === 'production'
export const isTest = config.NODE_ENV === 'test'
