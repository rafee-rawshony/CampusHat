'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { Filter, ChevronDown, List as ListIcon, Grid as GridIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SharedMallSidebar } from '@/components/mall/SharedMallSidebar'

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
        queryFn: () => api.get('/mall/products/', { params: filters }).then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] }),
    })

    const { data: categoriesData } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] }),
        staleTime: 300_000,
    })

    const { data: brandsData } = useQuery({
        queryKey: ['mall-brands'],
        queryFn: () => api.get('/mall/products/brands/').then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] }),
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
                <div className="w-full md:w-[260px] lg:w-[280px] shrink-0">
                    <SharedMallSidebar 
                        mode="filter"
                        showSearch={true}
                        searchQuery={filters.search}
                        onSearchChange={(val) => handleFilterChange('q', val)}
                        searchPlaceholder="Search products..."
                        showCategories={true}
                        selectedCategories={filters.category ? [filters.category] : []}
                        onCategoryToggle={(slug) => handleFilterChange('category', filters.category === slug ? '' : slug)}
                        showPriceRange={true}
                        localMinPrice={localMin}
                        localMaxPrice={localMax}
                        onMinPriceChange={setLocalMin}
                        onMaxPriceChange={setLocalMax}
                        onApplyPrice={applyPriceFilter}
                        showAvailability={true}
                        inStockOnly={filters.in_stock === 'true'}
                        onInStockChange={(val) => handleFilterChange('in_stock', val ? 'true' : '')}
                        className={isMobileFiltersOpen ? 'fixed inset-0 z-50 bg-[#F5F5F5] p-6 overflow-y-auto rounded-none border-none' : 'hidden md:block sticky top-4'}
                    />

                    {isMobileFiltersOpen && (
                        <div className="md:hidden mt-8 pt-4 border-t border-gray-100 pb-20 fixed bottom-0 left-0 right-0 p-4 bg-white z-[60] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                            <Button className="w-full bg-[#4C3B8A] hover:bg-gray-800 rounded-xl font-bold h-12" onClick={() => setIsMobileFiltersOpen(false)}>
                                View Results ({products.length})
                            </Button>
                        </div>
                    )}
                </div>

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
