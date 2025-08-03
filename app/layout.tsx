import { type Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/navbar'
import UserSyncer from '@/components/UserSyncer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'XyStorage - Data Reimagined',
  description: 'Simple drag and drop file manager',
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
        <UserSyncer />
        <Navbar />
        {children}
        </body>
        </html>
      </ClerkProvider>
  )
}