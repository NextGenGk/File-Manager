'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SignIn } from '@clerk/nextjs'
import { cn } from "@/lib/utils"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // If user is not signed in, show the sign-in component
  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center pt-20">
        {/* Custom CSS to make social provider icons white */}
        <style jsx global>{`
          .cl-socialButtonsBlockButton svg,
          .cl-socialButtonsProviderIcon svg,
          .cl-providerIcon svg {
            filter: invert(1) brightness(0) invert(1) !important;
          }
          .cl-socialButtonsBlockButton {
            color: white !important;
          }
        `}</style>

        {/* Grid Background */}
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:40px_40px]",
            "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
          )}
        />
        {/* Radial gradient for the container to give a faded look */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

        <div className="relative z-20 w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to XyStorage</h1>
            <p className="text-neutral-400">Sign in to access your cloud storage</p>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg border-0 rounded-2xl !bg-black backdrop-blur-md border border-white/20",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "rounded-xl border-white/20 hover:bg-white/10 text-white !bg-black",
                socialButtonsProviderIcon: "filter invert brightness-0 invert",
                formButtonPrimary: "!bg-black hover:!bg-gray-800 rounded-xl border border-white/20 text-white",
                footerActionLink: "text-white hover:text-neutral-300",
                formFieldInput: "!bg-black border-white/20 text-white placeholder:text-neutral-400",
                formFieldLabel: "text-white",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-neutral-300",
                formFieldSuccessText: "text-green-400",
                formFieldErrorText: "text-red-400",
                formFieldWarningText: "text-yellow-400",
                dividerLine: "bg-white/20",
                dividerText: "text-neutral-400",
                formHeaderTitle: "text-white",
                formHeaderSubtitle: "text-neutral-400",
                otpCodeFieldInput: "!bg-black border-white/20 text-white",
                formResendCodeLink: "text-white hover:text-neutral-300",
                alertText: "text-white",
                footer: "hidden"
              }
            }}
            redirectUrl="/"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    )
  }

  // If user is signed in, render the protected content
  return <>{children}</>
}
