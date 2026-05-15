'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, Search, FileQuestion } from 'lucide-react'

export default function MarketplaceNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-[#4C3B8A]/10 flex items-center justify-center mx-auto mb-5">
                    <FileQuestion className="w-8 h-8 text-[#4C3B8A]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    This listing may have been removed or the link might be incorrect.
                    Try searching for what you need.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/marketplace"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4C3B8A] text-white text-sm font-semibold rounded-xl hover:bg-[#3D2F6E] transition-all shadow-sm"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Browse Marketplace
                    </Link>
                    <Link
                        href="/marketplace/explorer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        <Search className="w-4 h-4" />
                        Explorer
                    </Link>
                </div>
                <button
                    onClick={() => window.history.back()}
                    className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#4C3B8A] font-medium transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Go back
                </button>
            </div>
        </div>
    )
}
