const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Production-ready server configuration
const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3001

// Enhanced Node.js configuration for production
if (!dev) {
  // Production optimizations
  process.env.NODE_OPTIONS = '--max-http-header-size=65536 --max-old-space-size=4096'
} else {
  process.env.NODE_OPTIONS = '--max-http-header-size=65536'
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Graceful shutdown handling
let server

const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)

  if (server) {
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err)
        process.exit(1)
      }
      console.log('✅ Server closed successfully')
      process.exit(0)
    })

    // Force close after 30 seconds
    setTimeout(() => {
      console.log('⚠️ Forcing server shutdown after timeout')
      process.exit(1)
    }, 30000)
  } else {
    process.exit(0)
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err)
  if (dev) {
    console.error(err.stack)
  }
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  if (dev) {
    console.error(reason)
  }
  gracefulShutdown('unhandledRejection')
})

app.prepare().then(() => {
  server = createServer(async (req, res) => {
    try {
      // Enhanced security headers
      res.setHeader('X-Powered-By', 'S3-UI')
      res.setHeader('Server', 'S3-UI')

      // CORS headers for production
      if (!dev) {
        res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')
      }

      res.setHeader('Access-Control-Max-Age', '86400')

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('💥 Error occurred handling', req.url, err)

      // Don't expose internal errors in production
      if (dev) {
        res.statusCode = 500
        res.end(`Internal server error: ${err.message}`)
      } else {
        res.statusCode = 500
        res.end('Internal server error')
      }
    }
  })

  // Production server configuration
  server.timeout = 60000 // 60 seconds
  server.headersTimeout = 65000 // 65 seconds
  server.requestTimeout = 60000 // 60 seconds
  server.keepAliveTimeout = 5000 // 5 seconds
  server.maxHeadersCount = 1000

  server.listen(port, hostname, (err) => {
    if (err) throw err

    const mode = dev ? 'development' : 'production'
    console.log(`🚀 Server ready on http://${hostname}:${port} (${mode})`)
    console.log(`📊 HTTP header limit: 64KB`)
    console.log(`🔒 Security headers: ${!dev ? 'enabled' : 'development mode'}`)
    console.log(`⚡ Keep-alive timeout: 5s`)

    if (!dev) {
      console.log(`🌐 CORS origin: ${process.env.APP_URL || 'all origins'}`)
    }
  })

  // Log server metrics periodically in production
  if (!dev) {
    setInterval(() => {
      const usage = process.memoryUsage()
      console.log(`📈 Memory usage: ${Math.round(usage.heapUsed / 1024 / 1024)} MB / ${Math.round(usage.heapTotal / 1024 / 1024)} MB`)
    }, 5 * 60 * 1000) // Every 5 minutes
  }
})
