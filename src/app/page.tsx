"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If the user is already authenticated, redirect to the dashboard
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4 overflow-hidden">
      {/* Background SVG pattern */}
      <svg className="absolute inset-0 z-0 opacity-10" width="100%" height="100%">
        <defs>
          <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.2)" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
      </svg>

      <div className="relative z-10 rounded-xl bg-white p-10 text-center shadow-2xl max-w-lg w-full transform transition-all duration-500 hover:scale-105">
        {/* Heart SVG icon */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-32 h-32 text-red-500 animate-pulse-svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        <h1 className="mb-4 text-5xl font-extrabold text-gray-900 leading-tight">
          Smart Pacemaker System
        </h1>
        <p className="mb-8 text-xl text-gray-700 leading-relaxed">
          Monitor and control your pacemaker in real-time with precision.
        </p>
        <button
          onClick={() => signIn('github')} // Or any other provider you have configured
          className="relative overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-4 text-xl font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-75 group"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative z-10">Login to Continue</span>
        </button>
        <p className="mt-8 text-base text-gray-500">
          Powered by Next.js, Tailwind CSS, and ESP32
        </p>
      </div>

      {/* Add custom pulsating animation for SVG */}
      <style jsx>{`
        @keyframes pulse-svg {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .animate-pulse-svg {
          animation: pulse-svg 2s infinite;
        }
      `}</style>
    </div>
  )
}
