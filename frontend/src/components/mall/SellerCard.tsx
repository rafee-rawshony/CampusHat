'use client'

import React from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SellerCardProps {
    store: {
        id: string
        slug: string
        name?: string
        store_name?: string
        description?: string
        logo?: string
        logo_url?: string
        profile_picture?: string
        banner?: string
        store_banner?: string
        banner_color?: string
        color?: string
        badge_label?: string
        follower_count?: number
        followers_count?: number
        product_count?: number
        total_products?: number
        rating_avg?: number | string
        created_at?: string
    }
}

const FALLBACK_COLORS = ['#4C3B8A', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#6366F1']

export function SellerCard({ store }: SellerCardProps) {
    const storeName = store.name || store.store_name || 'CampusHat Store'
    const initials = storeName.slice(0, 2).toUpperCase()

    const bannerColor = (store.banner_color && store.banner_color.startsWith('#'))
        ? store.banner_color
        : FALLBACK_COLORS[storeName.length % FALLBACK_COLORS.length]

    const bannerUrl = store.banner || store.store_banner || null
    const logoUrl   = store.logo || store.logo_url || store.profile_picture || null
    const rating    = Number(store.rating_avg || 0)
    const products  = store.product_count ?? store.total_products ?? 0
    const followers = store.follower_count ?? store.followers_count ?? 0

    return (
        <Link href={`/sellers/${store.slug}`} className="group block">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer">

                {/* Banner */}
                <div className="h-24 relative w-full" style={{ backgroundColor: bannerColor }}>
                    {bannerUrl && (
                        <img src={bannerUrl} alt={storeName} className="w-full h-full object-cover" />
                    )}
                </div>

                {/* Logo — overlaps banner */}
                <div className="relative px-4">
                    <div
                        className="w-12 h-12 rounded-xl border-2 border-white shadow-sm overflow-hidden -mt-5 inline-flex items-center justify-center"
                        style={{ backgroundColor: bannerColor }}
                    >
                        {logoUrl ? (
                            <img src={logoUrl} alt={storeName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-sm">{initials}</span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="pt-2 px-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                            {storeName}
                        </h3>
                    </div>

                    {store.badge_label && (
                        <span className="text-[10px] bg-[#4C3B8A]/10 text-[#4C3B8A] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">
                            {store.badge_label}
                        </span>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{products} products</span>
                        <span>{followers.toLocaleString()} followers</span>
                    </div>

                    {/* Rating */}
                    {rating > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
                        </div>
                    )}

                    {/* CTA Button */}
                    <div className="mt-3">
                        <span className="block w-full border border-[#4C3B8A] text-[#4C3B8A] text-xs font-semibold text-center py-2 rounded-lg hover:bg-[#4C3B8A] hover:text-white transition-colors group-hover:bg-[#4C3B8A] group-hover:text-white">
                            Visit Store
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
