'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ChevronRight, Store } from 'lucide-react'

import { SharedMallSidebar } from '@/components/mall/SharedMallSidebar'
import { SellerCard, SellerCardProps } from '@/components/mall/SellerCard'

export default function SellersPage() {
    // Client-side filtering state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedRating, setSelectedRating] = useState<number | null>(null)

    // Query 
    const { data: storesRaw, isLoading } = useQuery({
        queryKey: ['all-stores-redesign'],
        queryFn: () => api.get('/stores/').then(r => { 
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data
            return Array.isArray(res) ? res : [] 
        }).catch(() => []),
        staleTime: 300_000,
    })

    const allStores = storesRaw || []

    // Client-side filtering logic
    const filteredStores = allStores.filter((s: any) => {
        // Search
        if (searchQuery && !s.store_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
        
        // Category filter
        if (selectedCategories.length > 0) {
            const cat = s.store_category || ''
            if (!cat || !selectedCategories.includes(cat)) return false
        }

        // Rating
        if (selectedRating !== null) {
            const rating = Number(s.rating_avg) || 0
            if (rating < selectedRating) return false
        }

        return true
    })

    return (
        <>
            <div className="bg-[#F8F9FA] min-h-screen py-6 md:py-8">
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-[13px] font-semibold text-gray-400 gap-2 mb-6">
                        <Link href="/" className="hover:text-[#4C3B8A] transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-gray-900">Sellers</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
                        
                        {/* LEFT COLUMN: SIDEBAR */}
                        <div className="w-full md:w-[260px] lg:w-[280px] shrink-0">
                            <SharedMallSidebar 
                                mode="filter"
                                showSearch={true}
                                showCategories={true}
                                showRating={true}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                selectedCategories={selectedCategories}
                                onCategoryToggle={(slug) => {
                                    if (selectedCategories.includes(slug)) {
                                        setSelectedCategories(selectedCategories.filter(c => c !== slug))
                                    } else {
                                        setSelectedCategories([...selectedCategories, slug])
                                    }
                                }}
                                selectedRating={selectedRating}
                                onRatingChange={setSelectedRating}
                                className="sticky top-4 hidden md:block w-full"
                            />
                        </div>

                        {/* RIGHT COLUMN: MAIN GRID BINDING */}
                        <div className="flex-1 min-w-0">
                            <div className="mb-6">
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Our Sellers</h1>
                            </div>
                            
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                                    {Array(9).fill(null).map((_, i) => (
                                        <div key={i} className="bg-white rounded-xl h-[280px] border border-gray-100 shadow-sm animate-pulse flex flex-col">
                                            <div className="h-[100px] w-full bg-gray-200"></div>
                                            <div className="w-20 h-20 rounded-full bg-gray-300 mx-auto -mt-10 border-4 border-white z-10"></div>
                                            <div className="flex-1 p-4 flex flex-col items-center">
                                                <div className="w-3/4 h-5 bg-gray-200 rounded mt-2"></div>
                                                <div className="w-1/2 h-3 bg-gray-200 rounded mt-3"></div>
                                                <div className="w-full h-10 bg-gray-200 rounded-lg mt-auto"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredStores.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                                    {filteredStores.map((store: any) => (
                                        <SellerCard key={store.id} store={store} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                                    <Store className="w-16 h-16 text-gray-200 mb-4" />
                                    <h3 className="text-[19px] font-bold text-gray-900 mb-2">No sellers match your criteria</h3>
                                    <p className="text-sm text-gray-500 max-w-sm">
                                        Try adjusting your filters or search query to discover more stores.
                                    </p>
                                    {(searchQuery || selectedCategories.length > 0 || selectedRating) && (
                                        <button 
                                            onClick={() => {
                                                setSearchQuery('')
                                                setSelectedCategories([])
                                                setSelectedRating(null)
                                            }}
                                            className="mt-6 px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}
