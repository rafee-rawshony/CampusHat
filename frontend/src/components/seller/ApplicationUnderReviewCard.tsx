import React from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ApplicationUnderReviewCard() {
    return (
        <div className="flex flex-col min-h-screen bg-[#F5F5F5] items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-md w-full shadow-sm">
                <div className="flex justify-center mb-5">
                    <div className="bg-[#4C3B8A]/10 rounded-full p-4 animate-pulse">
                        <Clock className="w-12 h-12 text-[#4C3B8A]" />
                    </div>
                </div>

                <h2 className="font-bold text-2xl text-gray-900 mt-2">Application Under Review</h2>
                
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                    Our team is reviewing your seller application.
                    You'll be notified within 24-48 hours once approved.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
                    <p className="text-sm text-blue-800 font-medium">
                        📧 Check your email for updates on your application.
                    </p>
                </div>

                <Link href="/" className="block mt-6">
                    <Button variant="outline" className="w-full border-[#4C3B8A] text-[#4C3B8A] hover:bg-[#4C3B8A]/5 font-semibold">
                        Back to Homepage
                    </Button>
                </Link>
            </div>
        </div>
    )
}
