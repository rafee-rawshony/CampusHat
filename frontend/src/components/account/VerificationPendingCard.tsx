'use client'

import { Clock } from 'lucide-react'
import Link from 'next/link'

export function VerificationPendingCard() {
    return (
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <div className="mx-auto w-24 h-24 bg-[#4C3B8A]/10 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-12 h-12 text-[#4C3B8A] animate-pulse" />
            </div>

            <h2 className="font-bold text-xl text-gray-900 mt-4">Verification Pending</h2>
            
            <p className="text-sm text-gray-500 mt-3">
                Your verification request has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500 mt-1">
                Our team will review your documents within 24-48 hours.
            </p>
            <p className="text-sm text-gray-400 mt-1">
                We'll notify you by email once your account is verified.
            </p>

            <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mt-6">
                📧 Check your email for updates on your verification status.
            </div>

            <Link href="/marketplace" className="inline-block mt-8">
                <button className="border-2 border-[#4C3B8A] text-[#4C3B8A] hover:bg-[#4C3B8A]/5 font-semibold px-8 py-2.5 rounded-lg transition-colors">
                    Back to Marketplace
                </button>
            </Link>
        </div>
    )
}
