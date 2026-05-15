'use client'
export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, GraduationCap, Home } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { PostAdForm } from '@/components/marketplace/PostAdForm'

function VerificationRequiredCard() {
    const router = useRouter()
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-lg mx-auto mt-12 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-[#4C3B8A]/10 text-[#4C3B8A] rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Required</h2>
            <p className="text-gray-600 mb-8">
                If you are a student, please verify your student status to unlock student-only features.
            </p>
            <div className="flex flex-col space-y-3">
                <button
                    onClick={() => router.push('/account/verify')}
                    className="w-full bg-[#4C3B8A] text-white font-semibold py-3 rounded-lg hover:bg-[#3D2F6E] transition-colors"
                >
                    Verify as Student
                </button>
                <button
                    onClick={() => router.push('/marketplace')}
                    className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Continue as Regular User
                </button>
            </div>
        </div>
    )
}

function PostAdWrapper() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams?.get('edit')
    
    const { isAuthenticated, canAccessMarketplace } = useAuthStore()

    useEffect(() => {
        // Redirection must be triggered in useEffect due to App Router context rules.
        if (!isAuthenticated) {
            router.replace('/auth/login?redirect=/marketplace/post')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated) return null // Hide until redirect

    if (!canAccessMarketplace()) {
        return (
            <div className="min-h-screen bg-white px-4 pb-20">
                <VerificationRequiredCard />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen pb-20 pt-8">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm mb-6">
                    <Link href="/" className="text-gray-400 hover:text-[#4C3B8A] transition-colors shrink-0">
                        <Home className="w-3.5 h-3.5" />
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <Link href="/marketplace" className="text-gray-500 hover:text-[#4C3B8A] transition-colors font-medium whitespace-nowrap">
                        Marketplace
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <span className="text-gray-900 font-semibold">
                        {editId ? 'Edit Advertisement' : 'Post New Ad'}
                    </span>
                </nav>

                {/* Page Header */}
                <div className="text-center mb-4 sm:mb-8">
                    <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 mb-1">
                        {editId ? 'Edit Your Ad' : 'What are you offering?'}
                    </h1>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 px-2">
                        {editId ? 'Update your listing details below.' : 'Reach fellow students across your campus community in minutes.'}
                    </p>
                </div>

                {/* Form component handles all section UI */}
                <PostAdForm editId={editId} />
            </div>
        </div>
    )
}

export default function PostAdPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-20 text-center animate-pulse text-gray-500">Loading form...</div>}>
            <PostAdWrapper />
        </Suspense>
    )
}
