'use client'

import React from 'react'
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'

export function VerificationApprovedCard() {
    const { user } = useAuthStore()
    
    return (
        <div className="bg-white border border-green-200 rounded-xl p-8 text-center shadow-sm max-w-2xl mx-auto mt-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Complete!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Congratulations, {user?.full_name?.split(' ')[0] || 'there'}! Your identity has been verified. You now have full access to the CampusHat Marketplace and student-only features.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                    href="/mall"
                    className="flex items-center justify-center gap-2 bg-[#4C3B8A] hover:bg-[#38266e] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                    <ShoppingBag className="w-5 h-5" />
                    Visit Marketplace
                </Link>
                <Link 
                    href="/account"
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                    Back to Profile
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    )
}
