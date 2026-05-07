'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

import { VerificationReviewTab } from '@/components/admin/ReviewCenter/VerificationReviewTab'
import { SellerApplicationTab } from '@/components/admin/ReviewCenter/SellerApplicationTab'
import { MarketplaceAdReviewTab } from '@/components/admin/ReviewCenter/MarketplaceAdReviewTab'

export default function AdminReviewCenter() {
    const { isAdmin, isModerator, isSellerModerator, isMarketplaceModerator } = useAuthStore()

    const visibleTabs = useMemo(() => {
        return [
            {
                id: 'verifications',
                label: 'Student Verification',
                show: isAdmin() || isModerator(),
            },
            {
                id: 'sellers',
                label: 'Seller Applications',
                show: isAdmin() || isSellerModerator() || isModerator(),
            },
            {
                id: 'marketplace',
                label: 'Marketplace Ads',
                show: isAdmin() || isMarketplaceModerator() || isModerator(),
            },
        ].filter(t => t.show)
    }, [isAdmin, isModerator, isSellerModerator, isMarketplaceModerator])

    const [activeTab, setActiveTab] = useState<string>('')

    useEffect(() => {
        if (!activeTab && visibleTabs.length > 0) {
            setActiveTab(visibleTabs[0].id)
        }
    }, [visibleTabs, activeTab])

    // Fetch counts for the badges
    // We can fetch individually to match the specific tabs, or fetch the global counts object
    const { data: counts } = useQuery({
        queryKey: ['admin-pending-counts'],
        queryFn: () => api.get('/admin/approvals/counts/').then(r => r.data?.data || r.data),
        refetchInterval: 60_000, 
    })

    const getCountForTab = (id: string) => {
        if (!counts) return 0
        switch (id) {
            case 'verifications': return counts.verifications || counts.student_verifications || 0
            case 'sellers': return counts.sellers || counts.seller_applications || 0
            case 'marketplace': return counts.marketplace || counts.marketplace_ads || 0
            default: return 0
        }
    }

    if (!activeTab) return null

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="font-bold text-2xl text-gray-900 tracking-tight">Review Center</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review and approve pending submissions from students and sellers.
                </p>
            </div>

            {/* Tabs Row */}
            <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto custom-scrollbar">
                {visibleTabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const count = getCountForTab(tab.id)
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2
                                ${isActive 
                                    ? 'border-[#4C3B8A] text-[#4C3B8A]' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                    ${isActive ? 'bg-[#4C3B8A]/10 text-[#4C3B8A]' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    {count > 99 ? '99+' : count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'verifications' && <VerificationReviewTab />}
                {activeTab === 'sellers' && <SellerApplicationTab />}
                {activeTab === 'marketplace' && <MarketplaceAdReviewTab />}
            </div>
        </div>
    )
}
