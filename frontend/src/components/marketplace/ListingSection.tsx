'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCampusStore } from '@/stores/campus.store'
import { MarketplaceListingCard } from './MarketplaceListingCard'

interface ListingSectionProps {
    title: string
    postType: string
    viewAllHref: string
}

export function ListingSection({ title, postType, viewAllHref }: ListingSectionProps) {
    const { selectedCampusId } = useCampusStore()

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['marketplace-listings', postType, selectedCampusId],
        queryFn: async () => {
            const params: Record<string, any> = { post_type: postType, page_size: 4 }
            if (selectedCampusId) params.university = selectedCampusId
            const res = await api.get('/marketplace/listings/', { params })
            // Handle various Django REST response shapes
            return res.data?.data?.results || res.data?.results || res.data?.data || res.data || []
        },
    })

    const listings = Array.isArray(data) ? data : []

    return (
        <section>
            <div className="flex items-center justify-between mb-3 sm:mb-6">
                <h2 className="text-base sm:text-xl font-bold text-gray-900">{title}</h2>
                <Link
                    href={viewAllHref}
                    className="text-[#4C3B8A] text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 active:scale-95 transition-transform"
                >
                    View All <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-200 animate-pulse h-56 sm:h-72 rounded-xl" />
                    ))}
                </div>
            ) : isError ? (
                <div className="text-center py-10 sm:py-12 text-gray-400">
                    <p className="mb-2 font-medium text-sm">Could not load listings. Try again.</p>
                    <button
                        onClick={() => refetch()}
                        className="text-[#4C3B8A] text-sm font-semibold hover:underline"
                    >
                        Retry
                    </button>
                </div>
            ) : listings.length === 0 ? (
                <div className="text-center py-10 sm:py-12 text-gray-400">
                    <p className="font-medium text-sm">No listings yet. Be the first to post!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {listings.map((item: any) => (
                        <MarketplaceListingCard key={item.id} listing={item} />
                    ))}
                </div>
            )}
        </section>
    )
}
