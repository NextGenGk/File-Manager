import { cn } from "@/lib/utils";
import React from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function GridBackgroundDemo() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleDashboardClick = () => {
    // Refresh the page to show the dashboard view
    window.location.reload();
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black pt-20">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <div className="relative z-20 text-center max-w-4xl mx-auto px-8">
        <h1 className="bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-4xl font-bold text-transparent sm:text-7xl mb-6">
          XyStorage – Data, Reimagined.
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 mb-8">
          A high-performance, developer-first cloud storage platform<br />
          built for speed, scalability, and total control.
        </p>
        {isSignedIn ? (
          <button 
            onClick={handleDashboardClick}
            className="inline-flex items-center px-6 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200 text-sm border border-white/20 backdrop-blur-sm"
          >
            Dashboard
          </button>
        ) : (
          <SignInButton>
            <button className="inline-flex items-center px-6 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200 text-sm border border-white/20 backdrop-blur-sm">
              Get Started
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}
