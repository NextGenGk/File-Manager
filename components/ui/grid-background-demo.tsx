import { cn } from "@/lib/utils";
import React from "react";
import { SignInButton } from "@clerk/nextjs";

export default function GridBackgroundDemo() {
  return (
    <div className="relative flex h-[50rem] w-full items-center justify-center bg-black">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
        <h1 className="bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-4xl font-bold text-transparent sm:text-7xl mb-6">
          XyStorage – Data, Reimagined.
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 mb-8">
          Fast, secure, and developer-first cloud storage built for scale.
        </p>
        <SignInButton>
          <button className="inline-flex items-center px-6 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200 text-sm border border-white/20 backdrop-blur-sm mt-4 !bg-white/10 hover:!bg-white/20">
            Get Started
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
