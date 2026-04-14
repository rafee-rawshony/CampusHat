'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

import MallCategoryTab from '@/components/admin/TaxonomyManager/MallCategoryTab'
import MarketplaceCategoryTab from '@/components/admin/TaxonomyManager/MarketplaceCategoryTab'

export default function AdminCategoriesPage() {
    const { isAdmin, _hasHydrated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (_hasHydrated && !isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [_hasHydrated, isAdmin, router])

    const [activeTab, setActiveTab] = useState<'mall' | 'marketplace'>('mall')

    if (!_hasHydrated) return null

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto h-full overflow-y-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Taxonomy Manager</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage product categories for Mall and Marketplace.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('mall')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors
                            ${activeTab === 'mall' 
                                ? 'border-[#4C3B8A] text-[#4C3B8A]' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Mall Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors
                            ${activeTab === 'marketplace' 
                                ? 'border-[#4C3B8A] text-[#4C3B8A]' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Marketplace Categories
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'mall' ? (
                    <MallCategoryTab />
                ) : (
                    <MarketplaceCategoryTab />
                )}
            </div>

        </div>
    )
}
