'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Something went wrong in the admin panel. Your data is safe.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4C3B8A] text-white text-sm font-semibold rounded-xl hover:bg-[#3D2F6E] transition-all shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <a
                        href="/admin"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
    )
}
