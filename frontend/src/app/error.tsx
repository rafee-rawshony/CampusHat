'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react'

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [mounted, setMounted] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        setMounted(true)
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:py-20">
            <div className={`w-full max-w-lg mx-auto text-center transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                {/* Error Icon */}
                <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center mx-auto border border-red-100">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-[10px] font-bold">!</span>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Something went wrong
                </h1>
                <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto leading-relaxed mb-8">
                    An unexpected error occurred. Don't worry, your data is safe.
                    Try refreshing or go back to the homepage.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                    <button
                        onClick={reset}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#4C3B8A] text-white text-sm font-semibold rounded-xl hover:bg-[#3D2F6E] active:scale-[0.97] transition-all shadow-md shadow-[#4C3B8A]/20"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:border-[#4C3B8A]/20 hover:bg-gray-50 active:scale-[0.97] transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </a>
                </div>

                {/* Back Link */}
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#4C3B8A] font-medium transition-colors group mb-6"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Go back
                </button>

                {/* Error Details (collapsible for devs) */}
                {error?.message && (
                    <div className="mt-6">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Bug className="w-3.5 h-3.5" />
                            {showDetails ? 'Hide' : 'Show'} error details
                        </button>
                        {showDetails && (
                            <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-xl text-left">
                                <p className="text-xs text-gray-500 font-mono break-all leading-relaxed">
                                    {error.message}
                                </p>
                                {error.digest && (
                                    <p className="text-[10px] text-gray-400 mt-2 font-mono">
                                        Digest: {error.digest}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
