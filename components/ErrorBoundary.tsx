'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // logErrorToService(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-black p-4">
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
      <p className="text-neutral-400 mb-6">
        {process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetError}
        className="inline-flex items-center px-6 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200 text-sm border border-white/20 backdrop-blur-sm"
      >
        Try Again
      </button>
    </div>
  </div>
)

export default ErrorBoundary
