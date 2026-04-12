'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { Filter, ChevronDown, List as ListIcon, Grid as GridIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ShopPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ShopPageContent />
        </React.Suspense>
    )
}
function ShopPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    
    // Convert to a plain object for useQuery
    const rawFilters = {
        category: searchParams?.get('category') || '',
        min_price: searchParams?.get('min') || '',
        max_price: searchParams?.get('max') || '',
        in_stock: searchParams?.get('in_stock') || '',
        brand: searchParams?.get('brand') || '',
        search: searchParams?.get('q') || '',
        ordering: searchParams?.get('sort') || '-created_at',
        page: searchParams?.get('page') || '1',
    }

    // Clean up empty params
    const filters = Object.fromEntries(
        Object.entries(rawFilters).filter(([_, v]) => v !== '')
    )

    const [localMin, setLocalMin] = useState(filters.min_price || '')
    const [localMax, setLocalMax] = useState(filters.max_price || '')
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['shop-products', filters],
        queryFn: () => api.get('/mall/products/', { params: filters }).then(r => r.data?.data?.results || r.data?.results || r.data?.data || r.data || []),
    })

    const { data: categoriesData } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => r.data?.data?.results || r.data?.results || r.data?.data || r.data || []),
        staleTime: 300_000,
    })

    const { data: brandsData } = useQuery({
        queryKey: ['mall-brands'],
        queryFn: () => api.get('/mall/products/brands/').then(r => r.data?.data?.results || r.data?.results || r.data?.data || r.data || []),
        staleTime: 300_000,
    })

    const products = productsData || []
    const categories = categoriesData || []
    const brands = brandsData || []

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        params.delete('page') // Reset to page 1
        router.push(`/shop?${params.toString()}`)
    }

    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (localMin) params.set('min', localMin)
        else params.delete('min')
        
        if (localMax) params.set('max', localMax)
        else params.delete('max')
        
        params.delete('page')
        router.push(`/shop?${params.toString()}`)
    }

    const resetFilters = () => {
        router.push('/shop')
        setLocalMin('')
        setLocalMax('')
    }

    const activeFilterCount = Object.keys(filters).filter(k => k !== 'page' && k !== 'ordering').length

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
                
                {/* MOBILE FILTERS TOGGLE */}
                <div className="md:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="font-black text-xl text-gray-900">Shop</h1>
                    <button 
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                        <Filter className="w-4 h-4" /> 
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-brand-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* LEFT SIDEBAR: FILTERS */}
                <aside className={`w-full md:w-[260px] shrink-0 space-y-6 ${isMobileFiltersOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-black text-gray-900 text-lg">Filters</h2>
                        <button onClick={resetFilters} className="text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors">
                            Reset All
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Categories */}
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Categories</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {(categories || []).map((cat: any) => (
                                    <label key={cat.id || cat.slug} className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer hover:text-brand-primary group">
                                        <input 
                                            type="radio" 
                                            name="category"
                                            checked={filters.category === cat.slug}
                                            onChange={() => handleFilterChange('category', cat.slug)}
                                            className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
                                        />
                                        {cat.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Price Range</h3>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <input 
                                    type="number" 
                                    placeholder="Min ৳" 
                                    value={localMin}
                                    onChange={(e) => setLocalMin(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="number" 
                                    placeholder="Max ৳" 
                                    value={localMax}
                                    onChange={(e) => setLocalMax(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                                />
                            </div>
                            <Button onClick={applyPriceFilter} variant="outline" className="w-full text-xs font-bold rounded-xl border-gray-200">
                                Apply Filter
                            </Button>
                        </div>

                        {/* Availability */}
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Availability</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={filters.in_stock === 'true'}
                                        onChange={(e) => handleFilterChange('in_stock', e.target.checked ? 'true' : '')}
                                        className="w-4 h-4 rounded text-brand-primary border-gray-300 focus:ring-brand-primary"
                                    />
                                    In Stock Only
                                </label>
                            </div>
                        </div>
                    </div>

                    {isMobileFiltersOpen && (
                        <div className="mt-8 pt-4 border-t border-gray-100 pb-20">
                            <Button className="w-full bg-brand-primary hover:bg-brand-dark rounded-xl font-bold" onClick={() => setIsMobileFiltersOpen(false)}>
                                Show Results
                            </Button>
                        </div>
                    )}
                </aside>

                {/* RIGHT CONTENT: Products */}
                <main className="flex-1 space-y-6">
                    <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-bold text-gray-500">
                            Showing <span className="text-gray-900">{productsLoading ? '...' : products.length}</span> items
                        </p>
                        <div className="flex items-center gap-4">
                            <select 
                                value={filters.ordering || '-created_at'}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                <option value="-created_at">Latest Arrivals</option>
                                <option value="price">Price: Low to High</option>
                                <option value="-price">Price: High to Low</option>
                                <option value="-rating_avg">Best Rating</option>
                            </select>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                <button className="p-1.5 bg-white shadow text-gray-900 rounded-lg"><GridIcon className="w-4 h-4" /></button>
                                <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg"><ListIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>

                    {productsLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {Array(12).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                            <h3 className="text-xl font-black text-gray-900 mb-2">No products match your filters</h3>
                            <button onClick={resetFilters} className="mt-4 text-brand-primary font-bold hover:underline">
                                Clear all filters
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
