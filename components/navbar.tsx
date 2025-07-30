'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { FolderOpen, User } from 'lucide-react'

export default function Navbar() {
  const { user } = useUser()

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-none">S3 Manager</span>
              <span className="text-xs text-gray-500 leading-none">Cloud Storage</span>
            </div>
          </Link>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <button className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-4">
                {/* User Profile Info */}
                <div className="hidden md:flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/80">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || 'User'}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 leading-none mt-0.5">
                      {user?.emailAddresses[0]?.emailAddress || 'Welcome back'}
                    </p>
                  </div>
                </div>

                {/* Mobile Profile - Just Avatar */}
                <div className="md:hidden flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-200/80">
                  <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || 'User'}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.firstName || 'User'}
                  </span>
                </div>

                {/* User Button */}
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 rounded-xl border-2 border-gray-200 shadow-sm",
                      userButtonPopover: "rounded-xl shadow-lg border-gray-200"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  )
}
