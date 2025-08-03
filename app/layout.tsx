import { type Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/navbar'
import UserSyncer from '@/components/UserSyncer'
import ErrorBoundary from '@/components/ErrorBoundary'

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
  return (
    <ClerkProvider
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
            <UserSyncer />
            <Navbar />
            {children}
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}