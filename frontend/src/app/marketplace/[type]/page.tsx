'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Filter } from 'lucide-react'
import { MarketplaceAdCard, MarketplaceListing } from '@/components/marketplace/MarketplaceAdCard'
import { api } from '@/lib/api'
import { useCampusStore } from '@/stores/campus.store'

// Map the URL path parameter (e.g. 'buy', 'rental') to the backend 'post_type' values (e.g. 'sell', 'rent')
const typeMap: Record<string, string> = {
    'buy': 'buy', // The backend actually expects 'buy' according to the grep we did from marketplace/page.tsx
    'rental': 'rental', // backend 'rental'
    'services': 'service', // backend 'service'
    'food': 'food', // backend 'food'
    'explorer': '', // empty string for 'all'
}

const titleMap: Record<string, string> = {
    'buy': 'Items & Goods for Sale',
    'rental': 'Housing & Tools for Rent',
    'services': 'Tutoring & Services',
    'food': 'Homemade Food & Meals',
    'explorer': 'Explore Marketplace',
}

export default function MarketplaceCategoryPage() {
    const params = useParams()
    const router = useRouter()
    const rawType = params?.type as string
    
    // Ensure the type is valid; fallback to explorer if not
    const backendPostType = typeMap[rawType] !== undefined ? typeMap[rawType] : ''
    const pageTitle = titleMap[rawType] || titleMap['explorer']

    const { selectedCampusId } = useCampusStore()
    const [listings, setListings] = useState<MarketplaceListing[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true)
            try {
                const apiParams: any = {}
                if (backendPostType) {
                    apiParams.post_type = backendPostType
                }
                if (selectedCampusId) {
                    apiParams.university = selectedCampusId
                }

                const res = await api.get('/marketplace/listings/', { params: apiParams })
                // Properly extract using the typical structure (whether results array or direct data)
                const items = res.data?.results || res.data?.data?.results || res.data?.data || res.data || []
                setListings(Array.isArray(items) ? items : [])
            } catch (error) {
                console.error("Failed to fetch listings:", error)
                setListings([])
            } finally {
                setLoading(false)
            }
        }

        fetchListings()
    }, [backendPostType, selectedCampusId])

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20">
            <div className="bg-white border-b border-gray-200 py-4 mb-6">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.push('/marketplace')}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
                    </div>
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100/80 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-gray-200 animate-pulse h-72 rounded-2xl" />
                        ))}
                    </div>
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {listings.map((item) => (
                            <MarketplaceAdCard key={item.id} listing={item} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm mt-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl opacity-50">📦</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
                        <p className="text-gray-500 mb-6">We couldn't find any items matching your criteria in this category.</p>
                        <Link 
                            href="/marketplace"
                            className="inline-block bg-brand-primary text-white font-medium px-6 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors"
                        >
                            Back to Marketplace
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
