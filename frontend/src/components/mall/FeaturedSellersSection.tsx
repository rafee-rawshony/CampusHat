'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getInitials } from '@/lib/initials'

import { absoluteMediaUrl } from '@/services/upload.service'

interface Store {
    slug: string
    name: string
    logo: string | null
    banner_color: string | null
    badge_label: string | null
}

interface Seller {
    id: string
    store: Store
    rating_avg: number
    follower_count: number
}

// Since the API spec specifies GET /api/v1/sellers/featured/ but it might return different shapes
// Example shape handling added based on standard DRF standard
export function FeaturedSellersSection() {
    const { data: sellersRaw, isLoading } = useQuery({
        queryKey: ['featured-sellers'],
        queryFn: async () => {
            // Note: Updated endpoint logic to accommodate possible DRF endpoint differences,
            // standard query limits applied via limit=8
            const res = await api.get('/sellers/featured/', { params: { limit: 8 } })
            const d = res.data?.data ?? res.data
            return Array.isArray(d) ? d : (d?.results ?? [])
        },
        staleTime: 300_000,
    })

    const sellers: Seller[] = sellersRaw || []

    // If API returns nothing and is done loading, hide the section entirely
    if (!isLoading && sellers.length === 0) return null

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl text-gray-900">Best Sellers</h2>
                <Link href="/sellers" className="text-[#4C3B8A] text-sm font-semibold hover:underline">
                    View All →
                </Link>
            </div>

            {/* Horizontal Scroll Row */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {isLoading
                    ? Array(6).fill(null).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-[80px] shrink-0">
                            <div className="w-[60px] h-[60px] rounded-full bg-gray-200 animate-pulse" />
                            <div className="h-2.5 w-14 bg-gray-200 rounded text-center animate-pulse mt-1" />
                        </div>
                    ))
                    : sellers.map((seller) => {
                        const { store } = seller
                        if (!store) return null

                        const initials = getInitials(store.name || 'S')
                        const bannerColor = store.banner_color || '#4C3B8A'
                        const logoUrl = absoluteMediaUrl(store.logo)

                        return (
                            <Link
                                key={seller.id}
                                href={`/sellers/${store.slug}`}
                                className="flex flex-col items-center gap-2 w-[80px] shrink-0 group"
                            >
                                <div
                                    className="w-[60px] h-[60px] rounded-full relative flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow overflow-hidden"
                                    style={{ backgroundColor: bannerColor }}
                                >
                                    {logoUrl ? (
                                        <Image
                                            src={logoUrl}
                                            alt={store.name}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                            sizes="60px"
                                        />
                                    ) : (
                                        <span className="text-white font-bold text-lg">{initials}</span>
                                    )}
                                </div>
                                {store.badge_label && (
                                    <span className="bg-[#4C3B8A] text-white text-[9px] px-1.5 py-0.5 rounded-full -mt-4 relative z-10 font-medium tracking-wide">
                                        {store.badge_label}
                                    </span>
                                )}
                                <span className="text-xs font-medium text-gray-700 text-center line-clamp-2 leading-tight group-hover:text-[#4C3B8A] transition w-full">
                                    {store.name}
                                </span>
                            </Link>
                        )
                    })
                }
            </div>
        </div>
    )
}
