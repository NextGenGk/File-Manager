import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h1>
          <p className="text-gray-600">Create your account to access 5GB of free cloud storage</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border-0 rounded-2xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "rounded-xl border-gray-200 hover:bg-gray-50",
              formButtonPrimary: "bg-black hover:bg-gray-800 rounded-xl",
              footerActionLink: "text-black hover:text-gray-700"
            }
          }}
        />
      </div>
    </div>
  )
}
