import { type Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/navbar'
import UserSyncer from '@/components/UserSyncer'
import ErrorBoundary from '@/components/ErrorBoundary'
import AuthWrapper from '@/components/auth-wrapper'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'XyStorage - Data Reimagined',
    template: '%s | XyStorage'
  },
  description: 'Fast, secure, and developer-first cloud storage built for scale. Upload, manage, and share your files with ease.',
  keywords: ['cloud storage', 'file manager', 'developer tools', 'S3', 'file upload'],
  authors: [{ name: 'XyStorage Team' }],
  creator: 'XyStorage',
  publisher: 'XyStorage',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  other: {
    'Content-Security-Policy': "frame-src 'self' https://*.clerk.dev https://*.clerk.com https://challenges.cloudflare.com https://www.google.com https://www.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.dev https://*.clerk.com https://challenges.cloudflare.com https://www.google.com https://www.gstatic.com;"
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'XyStorage - Data Reimagined',
    description: 'Fast, secure, and developer-first cloud storage built for scale.',
    siteName: 'XyStorage',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XyStorage - Data Reimagined',
    description: 'Fast, secure, and developer-first cloud storage built for scale.',
    creator: '@xystorage',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Check if Clerk key is properly configured
  if (!publishableKey || publishableKey.length < 50) {
    console.error('🚨 Clerk publishable key is missing or incomplete!');
    console.error('📋 Key length:', publishableKey?.length || 0);
    console.error('🔧 Please get the complete key from https://dashboard.clerk.com/');
    
    // Show error page instead of broken app
    return (
      <html lang="en">
        <body className="bg-black text-white min-h-screen flex items-center justify-center">
          <div className="max-w-md text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
            <p className="mb-4">Clerk authentication is not properly configured.</p>
            <div className="text-left bg-gray-900 p-4 rounded mb-4">
              <p className="text-sm mb-2">To fix this:</p>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Go to <a href="https://dashboard.clerk.com" className="text-blue-400 underline">dashboard.clerk.com</a></li>
                <li>Select your project</li>
                <li>Go to API Keys section</li>
                <li>Copy the complete Publishable Key</li>
                <li>Update your .env file</li>
              </ol>
            </div>
            <p className="text-sm text-gray-400">Current key length: {publishableKey?.length || 0} (should be 100+)</p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        elements: {
          formButtonPrimary: 'bg-black hover:bg-gray-800',
          card: 'shadow-xl border border-gray-200',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ErrorBoundary>
            <AuthWrapper>
              <UserSyncer />
              <Navbar />
              {children}
            </AuthWrapper>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
