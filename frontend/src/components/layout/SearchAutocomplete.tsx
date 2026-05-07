'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, TrendingUp, X, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SuggestedProduct {
    id: string
    name: string
    slug: string
    base_price: string
    discount_price: string | null
    images: { image_url: string }[]
    category_name?: string
}

const RECENT_KEY = 'campushat-recent-searches'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return []
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    } catch { return [] }
}

function addRecentSearch(term: string) {
    const recent = getRecentSearches().filter(s => s !== term)
    recent.unshift(term)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function clearRecentSearches() {
    localStorage.removeItem(RECENT_KEY)
}

interface SearchAutocompleteProps {
    className?: string
    isMobile?: boolean
    onClose?: () => void
}

export function SearchAutocomplete({ className, isMobile, onClose }: SearchAutocompleteProps) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [products, setProducts] = useState<SuggestedProduct[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load recent searches on mount
    useEffect(() => {
        setRecentSearches(getRecentSearches())
    }, [])

    // Click outside handler
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const searchProducts = useCallback(async (term: string) => {
        if (term.length < 2) {
            setProducts([])
            setCategories([])
            return
        }

        setIsSearching(true)
        try {
            const [prodRes, catRes] = await Promise.allSettled([
                api.get('/mall/products/', { params: { search: term, page_size: 5 } }),
                api.get('/mall/categories/', { params: { search: term, page_size: 3 } }),
            ])

            if (prodRes.status === 'fulfilled') {
                const data = prodRes.value.data?.data?.results || prodRes.value.data?.results || []
                setProducts(data.slice(0, 5))
            }
            if (catRes.status === 'fulfilled') {
                const data = catRes.value.data?.data?.results || catRes.value.data?.results || catRes.value.data?.data || []
                setCategories(Array.isArray(data) ? data.slice(0, 3) : [])
            }
        } catch { /* silently fail */ }
        setIsSearching(false)
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => searchProducts(val), 300)
    }

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim()) return
        addRecentSearch(query.trim())
        setIsOpen(false)
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
        onClose?.()
    }

    const handleProductClick = (slug: string) => {
        setIsOpen(false)
        router.push(`/products/${slug}`)
        onClose?.()
    }

    const handleCategoryClick = (slug: string) => {
        setIsOpen(false)
        router.push(`/categories/${slug}`)
        onClose?.()
    }

    const handleRecentClick = (term: string) => {
        setQuery(term)
        addRecentSearch(term)
        setIsOpen(false)
        router.push(`/shop?q=${encodeURIComponent(term)}`)
        onClose?.()
    }

    const handleClearRecent = () => {
        clearRecentSearches()
        setRecentSearches([])
    }

    const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0)

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Search products, categories..."
                        className={cn(
                            'w-full pl-10 pr-10 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl',
                            'focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30 focus:border-[#4C3B8A] focus:bg-white',
                            'transition-all placeholder:text-gray-400',
                            isMobile && 'text-base py-3'
                        )}
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setProducts([]); setCategories([]); inputRef.current?.focus() }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </form>

            {/* Dropdown */}
            {showDropdown && (
                <div className={cn(
                    'absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50',
                    'animate-in fade-in slide-in-from-top-2 duration-200',
                    isMobile ? 'max-h-[70vh]' : 'max-h-[400px]',
                    'overflow-y-auto'
                )}>
                    {/* Loading indicator */}
                    {isSearching && (
                        <div className="px-4 py-3 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-500">Searching...</span>
                        </div>
                    )}

                    {/* Recent Searches (when no query) */}
                    {query.length < 2 && recentSearches.length > 0 && (
                        <div className="p-3">
                            <div className="flex items-center justify-between px-1 mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent</span>
                                <button onClick={handleClearRecent} className="text-[10px] font-bold text-[#4C3B8A] hover:underline">Clear</button>
                            </div>
                            {recentSearches.map((term, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleRecentClick(term)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{term}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Category Suggestions */}
                    {categories.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Categories</span>
                            {categories.map((cat: any) => (
                                <button
                                    key={cat.id || cat.slug}
                                    onClick={() => handleCategoryClick(cat.slug)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors mt-1"
                                >
                                    <TrendingUp className="w-3.5 h-3.5 text-[#4C3B8A] shrink-0" />
                                    <span className="text-sm text-gray-800 font-medium">{cat.name}</span>
                                    <ArrowRight className="w-3 h-3 text-gray-400 ml-auto" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Product Suggestions */}
                    {products.length > 0 && (
                        <div className="p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Products</span>
                            {products.map((product) => {
                                const imgUrl = product.images?.[0]?.image_url
                                const price = product.discount_price || product.base_price
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductClick(product.slug)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors mt-1"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                            {imgUrl ? (
                                                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Search className="w-4 h-4 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm text-gray-900 font-medium truncate">{product.name}</p>
                                            {product.category_name && (
                                                <p className="text-[10px] text-gray-400">{product.category_name}</p>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-[#4C3B8A] shrink-0">
                                            ৳{parseFloat(price).toLocaleString()}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* View All Results */}
                    {query.length >= 2 && (
                        <button
                            onClick={handleSubmit}
                            className="w-full px-4 py-3 border-t border-gray-100 text-sm font-bold text-[#4C3B8A] hover:bg-[#4C3B8A]/5 transition-colors flex items-center justify-center gap-2"
                        >
                            View all results for &quot;{query}&quot;
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* No Results */}
                    {query.length >= 2 && !isSearching && products.length === 0 && categories.length === 0 && (
                        <div className="p-6 text-center">
                            <p className="text-sm text-gray-500">No results found for &quot;{query}&quot;</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
