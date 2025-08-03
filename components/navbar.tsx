'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { FolderOpen, User, Cloud, Key } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { user } = useUser()

  return (
    <motion.nav
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-7xl px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-2 shadow-xl">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-4 group">
            <motion.div
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl geist-transition border border-white/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FolderOpen className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white leading-none font-geist-sans">XyStorage</span>
          </Link>

          {/* Auth Section */}
          <div className="flex items-center space-x-6">
            <SignedOut>
              <SignInButton>
                <button className="inline-flex items-center px-6 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200 text-sm border border-white/20 backdrop-blur-sm !bg-white/10 hover:!bg-white/20">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-6">
                {/* Navigation Links */}
                <motion.div
                  className="hidden lg:flex items-center space-x-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Link
                    href="/api-keys"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <Key className="w-4 h-4" />
                    API Keys
                  </Link>
                </motion.div>

                {/* User Profile Info */}
                <motion.div
                  className="hidden md:flex items-center space-x-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="flex items-center space-x-3 px-4 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <motion.div
                      className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden border border-white/30"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {user?.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt={user.firstName || 'User'}
                          width={28}
                          height={28}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </motion.div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-white font-geist-sans">
                        {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Cloud className="w-3 h-3 text-white/60" />
                        <span className="text-xs text-white/60">Active</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* User Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 ring-2 ring-white/30 hover:ring-white/50 geist-transition",
                        userButtonPopoverCard: "backdrop-blur-md bg-white/90 shadow-xl border border-white/20"
                      }
                    }}
                  />
                </motion.div>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
