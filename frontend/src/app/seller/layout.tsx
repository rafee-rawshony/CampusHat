'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { SellerSidebar } from '@/components/seller/SellerSidebar'
import { SellerTopBar } from '@/components/seller/SellerTopBar'
import { SellerMobileHeader } from '@/components/seller/SellerMobileHeader'
import { AlertsPanel } from '@/components/seller/AlertsPanel'
import { ApplicationUnderReviewCard } from '@/components/seller/ApplicationUnderReviewCard'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { isAuthenticated, isSeller, isAdmin, user, _hasHydrated } = useAuthStore()

    useEffect(() => {
        if (!_hasHydrated) return

        if (!isAuthenticated) {
            router.push('/auth/login?redirect=/seller')
            return
        }

        if (!isSeller() && !isAdmin()) {
            // The user isn't an approved seller.
            // If they are pending, we just let them stay to see the Under Review Card down below.
            // If rejected or null, kick to apply.
            if (user?.seller_application_status !== 'pending') {
                router.push('/seller/apply')
            }
        }
    }, [isAuthenticated, isSeller, isAdmin, user?.seller_application_status, _hasHydrated, router])

    if (!_hasHydrated) return null

    // If pending and not an approved seller/admin
    if (!isSeller() && !isAdmin() && user?.seller_application_status === 'pending') {
        return <ApplicationUnderReviewCard />
    }

    // Render nothing if we are about to redirect
    if (!isAuthenticated || (!isSeller() && !isAdmin())) {
        return null
    }

    // Full Approved Layout
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#F5F5F5] w-full">
            
            {/* MOBILE ONLY: Single column + header */}
            <SellerMobileHeader />

            {/* DESKTOP Column 1: Sidebar */}
            <SellerSidebar />
            
            {/* DESKTOP Column 2: Main Dynamic Content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <div className="hidden md:block shrink-0">
                    <SellerTopBar />
                </div>
                
                <main className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* DESKTOP Column 3: Alerts */}
            <AlertsPanel />

        </div>
    )
}
