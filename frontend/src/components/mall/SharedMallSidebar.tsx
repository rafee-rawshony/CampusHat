'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { ChevronDown, ChevronUp, Star, LayoutGrid } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface SharedMallSidebarProps {
    /** 
     * `filter` uses checkboxes and triggers state updates for categories.
     * `navigation` uses direct anchor links for route matching.
     */
    mode?: 'filter' | 'navigation'
    baseRoute?: string // e.g. '/categories' or '/shop'

    // Feature Toggles
    showSearch?: boolean
    showCategories?: boolean
    showPriceRange?: boolean
    showRating?: boolean
    showAvailability?: boolean

    // --- State: Search ---
    searchQuery?: string
    onSearchChange?: (val: string) => void
    searchPlaceholder?: string

    // --- State: Categories (Filter Mode) ---
    selectedCategories?: string[] // Uses slugs
    onCategoryToggle?: (slug: string) => void

    // --- State: Categories (Navigation Mode) ---
    activeCategorySlug?: string | null

    // --- State: Rating ---
    selectedRating?: number | null
    onRatingChange?: (val: number | null) => void

    // --- State: Price Range ---
    localMinPrice?: string
    localMaxPrice?: string
    onMinPriceChange?: (val: string) => void
    onMaxPriceChange?: (val: string) => void
    onApplyPrice?: () => void

    // --- State: Availability ---
    inStockOnly?: boolean
    onInStockChange?: (val: boolean) => void

    className?: string
}

export function SharedMallSidebar({
    mode = 'filter',
    baseRoute = '/categories',
    showSearch = false,
    showCategories = true,
    showPriceRange = false,
    showRating = false,
    showAvailability = false,

    searchQuery = '',
    onSearchChange,
    searchPlaceholder = 'Search...',

    selectedCategories = [],
    onCategoryToggle,
    activeCategorySlug,

    selectedRating,
    onRatingChange,

    localMinPrice = '',
    localMaxPrice = '',
    onMinPriceChange,
    onMaxPriceChange,
    onApplyPrice,

    inStockOnly = false,
    onInStockChange,

    className
}: SharedMallSidebarProps) {
    const [categoriesOpen, setCategoriesOpen] = useState(true)
    const [ratingOpen, setRatingOpen] = useState(true)

    // Fetch Database Categories
    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => { 
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data
            return Array.isArray(res) ? res : [] 
        }),
        staleTime: 300_000,
    })

    const categories = categoriesData || []

    return (
        <aside className={cn("bg-white rounded-xl shadow-sm border border-gray-100 p-5", className)}>
            
            {/* SEARCH */}
            {showSearch && onSearchChange && (
                <>
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-[15px]">Search</h3>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#4C3B8A] transition-colors bg-gray-50/50 placeholder:text-gray-400"
                        />
                    </div>
                    {showCategories || showPriceRange || showRating ? <hr className="border-gray-100 mb-6" /> : null}
                </>
            )}

            {/* CATEGORIES */}
            {showCategories && (
                <div className="mb-6">
                    <button 
                        onClick={() => setCategoriesOpen(!categoriesOpen)}
                        className="w-full flex items-center justify-between font-semibold text-gray-900 mb-3 text-[15px]"
                    >
                        Product Categories
                        {categoriesOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    
                    {categoriesOpen && (
                        <div className="space-y-2.5 mt-2 transition-all">
                            {categoriesLoading ? (
                                Array(5).fill(null).map((_, i) => (
                                    <div key={i} className="h-5 bg-gray-100 rounded w-full animate-pulse my-2"></div>
                                ))
                            ) : mode === 'navigation' ? (
                                <>
                                    {/* Navigation Mode: Links + Icons */}
                                    <Link 
                                        href={baseRoute}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors block w-full",
                                            !activeCategorySlug 
                                                ? "bg-[#4C3B8A]/10 text-[#4C3B8A] font-bold" 
                                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                        )}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        <span>All Categories</span>
                                    </Link>
                                    
                                    {categories.map((cat: any) => {
                                        const IconComp = cat.icon ? (LucideIcons as any)[cat.icon] : null
                                        const isActive = activeCategorySlug === cat.slug

                                        return (
                                            <Link 
                                                key={cat.id || cat.slug}
                                                href={`${baseRoute}/${cat.slug}`}
                                                className={cn(
                                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors block w-full",
                                                    isActive 
                                                        ? "bg-[#4C3B8A]/10 text-[#4C3B8A] font-bold" 
                                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                )}
                                            >
                                                {IconComp ? <IconComp className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1.5 mr-1" />}
                                                <span className="truncate">{cat.name}</span>
                                            </Link>
                                        )
                                    })}
                                </>
                            ) : (
                                <>
                                    {/* Filter Mode: Checkboxes */}
                                    {categories.map((cat: any) => (
                                        <label key={cat.id || cat.slug} className="flex items-start gap-2.5 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                name="category"
                                                checked={selectedCategories.includes(cat.slug)}
                                                onChange={() => onCategoryToggle && onCategoryToggle(cat.slug)}
                                                className="mt-0.5 rounded border-gray-300 text-[#4C3B8A] focus:ring-[#4C3B8A] cursor-pointer"
                                            />
                                            <span className={cn(
                                                "text-sm transition-colors truncate",
                                                selectedCategories.includes(cat.slug) ? "text-gray-900 font-medium" : "text-gray-500 group-hover:text-gray-700"
                                            )}>
                                                {cat.name}
                                            </span>
                                        </label>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* PRICE RANGE */}
            {showPriceRange && onMinPriceChange && onMaxPriceChange && onApplyPrice && (
                <>
                    <hr className="border-gray-100 mb-6" />
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-[15px]">Price Range</h3>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <input 
                                type="number" 
                                placeholder="Min ৳" 
                                value={localMinPrice}
                                onChange={(e) => onMinPriceChange(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-[#4C3B8A]" 
                            />
                            <span className="text-gray-400">-</span>
                            <input 
                                type="number" 
                                placeholder="Max ৳" 
                                value={localMaxPrice}
                                onChange={(e) => onMaxPriceChange(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-[#4C3B8A]" 
                            />
                        </div>
                        <button 
                            onClick={onApplyPrice}
                            className="w-full text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 transition-colors"
                        >
                            Apply Filter
                        </button>
                    </div>
                </>
            )}

            {/* AVAILABILITY */}
            {showAvailability && onInStockChange && (
                <>
                    <hr className="border-gray-100 mb-6" />
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-[15px]">Availability</h3>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={inStockOnly}
                                onChange={(e) => onInStockChange(e.target.checked)}
                                className="rounded border-gray-300 text-[#4C3B8A] focus:ring-[#4C3B8A] cursor-pointer"
                            />
                            <span className={cn(
                                "text-sm transition-colors",
                                inStockOnly ? "text-gray-900 font-medium" : "text-gray-500 group-hover:text-gray-700"
                            )}>
                                In Stock Only
                            </span>
                        </label>
                    </div>
                </>
            )}

            {/* RATING */}
            {showRating && onRatingChange && (
                <>
                    {/* Add divider only if placed below prior categories */}
                    {showCategories || showPriceRange || showAvailability || showSearch ? <hr className="border-gray-100 mb-6" /> : null}
                    
                    <div>
                        <button 
                            onClick={() => setRatingOpen(!ratingOpen)}
                            className="w-full flex items-center justify-between font-semibold text-gray-900 mb-3 text-[15px]"
                        >
                            Seller Rating
                            {ratingOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        
                        {ratingOpen && (
                            <div className="space-y-2.5 mt-2">
                                {[5, 4, 3, 2, 1].map(stars => (
                                    <label key={stars} className="flex items-center gap-2.5 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedRating === stars}
                                            onChange={() => onRatingChange(selectedRating === stars ? null : stars)}
                                            className="rounded border-gray-300 text-[#4C3B8A] focus:ring-[#4C3B8A] cursor-pointer"
                                        />
                                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <div className="flex">
                                                {Array(5).fill(0).map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={cn(
                                                            "w-3.5 h-3.5",
                                                            i < stars ? "fill-[#FBBF24] text-[#FBBF24]" : "fill-gray-200 text-gray-200"
                                                        )} 
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium ml-1">& up</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

        </aside>
    )
}
