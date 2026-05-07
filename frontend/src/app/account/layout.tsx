'use client'

/**
 * Account dashboard shell.
 *
 * - Redirects unauthenticated users to login
 * - Renders the Daraz-style sidebar on the left
 * - Renders nested page content on the right
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { DashboardSidebar } from '@/components/account/DashboardSidebar'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, _hasHydrated, user } = useAuthStore()
    const router = useRouter()

    // Redirect to login if not signed in (only after hydration to avoid flicker)
    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.replace('/auth/login?redirect=/account')
        }
    }, [_hasHydrated, isAuthenticated, router])

    if (!_hasHydrated || !user) return null

    return (
        <div className="min-h-screen bg-surface-base pb-12">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-3 mb-6">
                <div className="container mx-auto px-4">
                    <div className="text-sm text-gray-500">
                        <Link href="/" className="hover:text-brand-primary">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 font-medium">My Account</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row gap-6">
                    <DashboardSidebar />
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </div>
    )
}
