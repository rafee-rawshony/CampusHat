'use client'

import Link from 'next/link'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-8">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldX className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors shadow-md"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </div>
        </div>
    )
}
