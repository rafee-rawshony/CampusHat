'use client'

import React from 'react'
import Link from 'next/link'
import { Store, ArrowLeft, FileQuestion } from 'lucide-react'

export default function SellerNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-[#4C3B8A]/10 flex items-center justify-center mx-auto mb-5">
                    <FileQuestion className="w-8 h-8 text-[#4C3B8A]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    This seller page doesn't exist. Check the URL or go back to your dashboard.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/seller"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4C3B8A] text-white text-sm font-semibold rounded-xl hover:bg-[#3D2F6E] transition-all shadow-sm"
                    >
                        <Store className="w-4 h-4" />
                        Seller Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
}
