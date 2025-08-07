'use client'

import { SignIn } from '@clerk/nextjs'
import { cn } from "@/lib/utils"

export default function OAuthCallbackPage() {
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

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">OAuth Callback</h1>
          <p className="text-gray-400">Completing your OAuth authentication...</p>
        </div>
        
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
          <SignIn 
            routing="path"
            path="/oauth-callback"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>
      </div>
    </div>
  )
}
