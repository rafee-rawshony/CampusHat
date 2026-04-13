'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCampusStore } from '@/stores/campus.store'
import { ExplorerSearchBar } from '@/components/marketplace/ExplorerSearchBar'
import { ExplorerFilterBar } from '@/components/marketplace/ExplorerFilterBar'
import { ExplorerResultsGrid } from '@/components/marketplace/ExplorerResultsGrid'

function ExplorerContent() {
    const searchParams = useSearchParams()
    const { selectedCampusId } = useCampusStore()

    // Read search params
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'
    const condition = searchParams.get('condition') || ''
    const min = searchParams.get('min') || ''
    const max = searchParams.get('max') || ''
    const sort = searchParams.get('sort') || '-created_at'
    const page = Number(searchParams.get('page')) || 1
    const pageSize = 12

    // Fetch listings
    const { data: response, isLoading } = useQuery({
        queryKey: ['explorer-listings', { q, type, condition, min, max, sort, selectedCampusId, page }],
        queryFn: async () => {
            const params: Record<string, any> = {
                status: 'active',
                page: page,
                page_size: pageSize,
                ordering: sort,
            }
            if (q) params.search = q
            if (type !== 'all') params.post_type = type
            if (condition) params.condition = condition
            if (min) params.min_price = min
            if (max) params.max_price = max
            if (selectedCampusId) params.university = selectedCampusId

            const res = await api.get('/marketplace/listings/', { params })
            return res.data
        },
        staleTime: 0,
    })

    const listings = response?.results || response?.data?.results || response?.data || []
    
    // Attempt to extract total count from Django REST API pagination
    const totalCount = response?.count || response?.data?.count || Array.isArray(listings) ? listings.length : 0

    // Fetch type counts using standard API meta if available, else we just ignore.
    const typeCounts = response?.type_counts || response?.data?.type_counts || undefined

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center text-sm text-gray-500 mb-8">
                    <Link href="/marketplace" className="hover:text-gray-800 hover:underline">Marketplace Home</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-700 font-medium">Explorer</span>
                </nav>

                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="font-bold text-2xl text-gray-900">Explore All Listings</h1>
                    <p className="text-gray-500 text-sm mt-1">Search across all campus listings — items, rentals, services and food.</p>
                </div>

                {/* Search Bar */}
                <ExplorerSearchBar />

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto">
                    <ExplorerFilterBar typeCounts={typeCounts} />
                    
                    <ExplorerResultsGrid 
                        listings={Array.isArray(listings) ? listings : []}
                        isLoading={isLoading}
                        query={q}
                        total={totalCount}
                        page={page}
                        pageSize={pageSize}
                    />
                </div>
            </main>
        </div>
    )
}

export default function ExplorerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-[#634C9F] border-t-transparent rounded-full animate-spin"></div></div>}>
            <ExplorerContent />
        </Suspense>
    )
}
