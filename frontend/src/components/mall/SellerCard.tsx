'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SellerCardProps {
    store: {
        id: string
        slug: string
        store_name: string
        store_category?: string
        logo_url?: string
        profile_picture?: string
        color?: string
        banner_color?: string
        rating_avg?: number | string
        total_products?: number | string
        created_at?: string
    }
}

// Map color classes to hex for fallback rendering
const FALLBACK_COLORS = [
    '#3B82F6', // Blue
    '#F59E0B', // Orange
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#10B981', // Green
]

export function SellerCard({ store }: SellerCardProps) {
    const storeName = store.store_name || (store as any).name || 'CampusHat Partner'

    // Generate initials (up to 2 chars)
    const initials = storeName.substring(0, 2).toUpperCase()
    
    // Attempt extracting year
    const memberSinceYear = store.created_at ? new Date(store.created_at).getFullYear() : '2023'

    // Colors mapping (handling old classes vs new hex if present)
    let bannerColor = store.banner_color || store.color
    if (!bannerColor || !bannerColor.startsWith('#')) {
        // use a determinist fallback based on ID length or string
        const hash = storeName.length % FALLBACK_COLORS.length
        bannerColor = FALLBACK_COLORS[hash]
    }

    // Default numeric falsy handling
    const rating = Number(store.rating_avg) || 0
    // If backend doesn't provide products count yet, fallback to a pseudo-random or 0
    const productsCount = store.total_products !== undefined ? store.total_products : (storeName.length % 10 + 1)

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative group hover:shadow-md transition-shadow">
            
            {/* Top Banner Area */}
            <div 
                className="h-[100px] w-full flex items-center justify-center px-4"
                style={{ backgroundColor: bannerColor }}
            >
                {/* Category or Banner text */}
                <h3 className="text-white font-medium text-[15px] truncate max-w-full -mt-2">
                    {store.store_category || 'Official Partner'}
                </h3>
            </div>

            {/* Logo Center Circle */}
            <div className="relative -mt-10 mx-auto z-10 w-20 h-20 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center">
                {store.logo_url || store.profile_picture ? (
                    <Image 
                        src={store.logo_url || store.profile_picture || ''} 
                        alt={storeName} 
                        fill 
                        className="object-cover" 
                    />
                ) : (
                    <div 
                        className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: bannerColor }}
                    >
                        {initials}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 px-4 pt-3 pb-5 flex flex-col items-center">
                
                {/* Store Name & Year */}
                <h2 className="font-bold text-gray-900 text-[17px] text-center line-clamp-1 mb-0.5">
                    {storeName}
                </h2>
                <p className="text-[11px] text-gray-400 font-medium mb-4">
                    Member since {memberSinceYear}
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-6 mb-5">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 font-bold text-gray-900 text-sm">
                            {rating > 0 ? rating.toFixed(1) : 'New'}
                            <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wide">Rating</span>
                    </div>
                    
                    <div className="h-6 w-[1px] bg-gray-200"></div>
                    
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-sm">{productsCount}</span>
                        <span className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wide">Products</span>
                    </div>
                </div>

                {/* Button */}
                <Link 
                    href={`/sellers/${store.slug}`}
                    className="w-full mt-auto block text-center bg-[#4C3B8A]/90 hover:bg-[#4C3B8A] text-white font-semibold py-2.5 rounded-lg text-[13px] transition-colors"
                >
                    Visit Store
                </Link>
            </div>
            
        </div>
    )
}
