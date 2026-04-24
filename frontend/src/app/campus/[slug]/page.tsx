'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Building2, Users, ShoppingBag, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import { ProductCard } from '@/components/mall/ProductCard'
import { MarketplaceAdCard } from '@/components/marketplace/MarketplaceAdCard'

export default function CampusPage() {
    const { slug } = useParams<{ slug: string }>()

    // Fetch campus/university info
    const { data: campus } = useQuery({
        queryKey: ['campus', slug],
        queryFn: () =>
            api.get(`/universities/${slug}/`).then(r => r.data?.data || r.data),
        staleTime: 300_000,
    })

    // Fetch campus mall products
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['campus-products', slug],
        queryFn: () =>
            api.get('/mall/products/', { params: { university_slug: slug, page_size: 12 } })
                .then(r => r.data?.data?.results || r.data?.results || []),
        enabled: !!campus,
    })

    // Fetch campus marketplace listings
    const { data: listingsData, isLoading: listingsLoading } = useQuery({
        queryKey: ['campus-listings', slug],
        queryFn: () =>
            api.get('/marketplace/listings/', {
                params: { university_slug: slug, status: 'active', page_size: 8 },
            }).then(r => r.data?.data?.results || r.data?.results || []),
        enabled: !!campus,
    })

    const products = productsData || []
    const listings = listingsData || []

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            {/* Campus Header */}
            {campus ? (
                <div className="bg-gradient-to-r from-[#4C3B8A] to-[#2D1B69] rounded-2xl p-6 text-white mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{campus.name}</h1>
                            <p className="text-white/70 text-sm mt-1">{campus.short_code}</p>
                            {campus.address && (
                                <p className="flex items-center gap-1 text-white/60 text-xs mt-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {campus.address}
                                </p>
                            )}
                            <div className="flex gap-4 mt-3">
                                {campus.student_count && (
                                    <span className="flex items-center gap-1 text-white/80 text-sm">
                                        <Users className="w-4 h-4" />
                                        {campus.student_count.toLocaleString()} students
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-white/80 text-sm">
                                    <ShoppingBag className="w-4 h-4" />
                                    Campus Marketplace
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-36 bg-gray-200 animate-pulse rounded-2xl mb-8" />
            )}

            {/* Mall Products from this Campus */}
            <section className="mb-10">
                <h2 className="font-bold text-xl text-gray-900 mb-4">
                    Products from {campus?.short_code || 'this campus'}
                </h2>
                {productsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array(8).fill(null).map((_, i) => (
                            <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((p: any) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm py-6 text-center">
                        No products listed from this campus yet.
                    </p>
                )}
            </section>

            {/* Marketplace Listings from this Campus */}
            <section>
                <h2 className="font-bold text-xl text-gray-900 mb-4">
                    Marketplace Ads from {campus?.short_code || 'this campus'}
                </h2>
                {listingsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array(6).fill(null).map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {listings.map((listing: any) => (
                            <MarketplaceAdCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm py-6 text-center">
                        No active marketplace listings from this campus yet.
                    </p>
                )}
            </section>
        </div>
    )
}
