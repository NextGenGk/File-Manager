/**
 * Health Check API Endpoint for Production Monitoring
 */

import { NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { logger } from '@/lib/error-handling'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  uptime: number
  environment: string
  services: {
    database: 'healthy' | 'unhealthy'
    storage: 'healthy' | 'unhealthy'
    auth: 'healthy' | 'unhealthy'
  }
  metrics: {
    memoryUsage: {
      used: number
      total: number
      percentage: number
    }
    requestCount?: number
  }
}

let requestCount = 0
const startTime = Date.now()

export async function GET(): Promise<NextResponse> {
  requestCount++
  const timestamp = new Date().toISOString()
  
  try {
    // Check individual services
    const services = await checkServices()
    
    // Calculate overall health
    const unhealthyServices = Object.values(services).filter(status => status === 'unhealthy')
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    
    if (unhealthyServices.length > 0) {
      overallStatus = unhealthyServices.length === Object.keys(services).length ? 'unhealthy' : 'degraded'
    }
    
    // Memory metrics
    const memoryUsage = process.memoryUsage()
    const memoryMetrics = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    }
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.round((Date.now() - startTime) / 1000), // seconds
      environment: config.NODE_ENV,
      services,
      metrics: {
        memoryUsage: memoryMetrics,
        requestCount
      }
    }
    
    // Log health check in production
    if (config.NODE_ENV === 'production') {
      logger.info('Health check performed', {
        action: 'health_check',
        metadata: {
          status: overallStatus,
          memoryUsage: memoryMetrics.percentage
        }
      })
    }
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(healthStatus, { status: statusCode })
    
  } catch (error) {
    logger.error('Health check failed', error as Error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        error: 'Health check failed',
        environment: config.NODE_ENV
      },
      { status: 503 }
    )
  }
}

async function checkServices(): Promise<HealthStatus['services']> {
  const services: HealthStatus['services'] = {
    database: 'unhealthy',
    storage: 'unhealthy',
    auth: 'unhealthy'
  }
  
  // Check Supabase database
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(config.supabase.url, config.supabase.anonKey)
    const { error } = await supabase.from('users').select('count').limit(1)
    services.database = error ? 'unhealthy' : 'healthy'
  } catch {
    services.database = 'unhealthy'
  }
  
  // Check S3 storage (basic connectivity)
  try {
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3')
    const s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    })
    
    await s3Client.send(new HeadBucketCommand({ Bucket: config.aws.bucketName }))
    services.storage = 'healthy'
  } catch {
    services.storage = 'unhealthy'
  }
  
  // Check Clerk auth (basic connectivity)
  try {
    // Simple check - if we can import Clerk without errors, consider it healthy
    await import('@clerk/nextjs/server')
    services.auth = 'healthy'
  } catch {
    services.auth = 'unhealthy'
  }
  
  return services
}

// Readiness probe for Kubernetes/Docker
export async function HEAD(): Promise<NextResponse> {
  try {
    const services = await checkServices()
    const isReady = Object.values(services).every(status => status === 'healthy')
    
    return new NextResponse(null, { status: isReady ? 200 : 503 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
