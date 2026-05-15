'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { Filter, ChevronRight, SearchX, ChevronDown, SlidersHorizontal, LayoutGrid, LayoutList, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
    { label: 'Latest Arrivals', value: '-created_at' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
    { label: 'Best Rating', value: '-rating_avg' },
    { label: 'Most Popular', value: '-sold_count' },
]

export default function ShopPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ShopPageContent />
        </React.Suspense>
    )
}

function ShopPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const rawFilters = {
        category:  searchParams?.get('category') || '',
        min_price: searchParams?.get('min') || '',
        max_price: searchParams?.get('max') || '',
        in_stock:  searchParams?.get('in_stock') || '',
        brand:     searchParams?.get('brand') || '',
        search:    searchParams?.get('q') || '',
        ordering:  searchParams?.get('sort') || '-created_at',
        page:      searchParams?.get('page') || '1',
    }

    const filters = Object.fromEntries(
        Object.entries(rawFilters).filter(([_, v]) => v !== '')
    )

    const [localMin, setLocalMin] = useState(filters.min_price || '')
    const [localMax, setLocalMax] = useState(filters.max_price || '')
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [catExpanded, setCatExpanded] = useState(true)
    const [brandExpanded, setBrandExpanded] = useState(true)

    // Products
    const { data: productsRaw, isLoading: productsLoading } = useQuery({
        queryKey: ['shop-products', filters],
        queryFn: () => api.get('/mall/products/', { params: { ...filters, is_active: true, page_size: 20 } }).then(r => {
            const data = r.data
            if (data?.results) return { results: data.results, count: data.count }
            if (Array.isArray(data)) return { results: data, count: data.length }
            if (data?.data?.results) return { results: data.data.results, count: data.data.count }
            return { results: [], count: 0 }
        }),
        staleTime: 60_000,
    })

    // Categories
    const { data: categoriesData } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => {
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data
            return Array.isArray(res) ? res : []
        }),
        staleTime: 300_000,
    })

    // Brands
    const { data: brandsData } = useQuery({
        queryKey: ['mall-brands'],
        queryFn: () => api.get('/mall/products/brands/').then(r => {
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data
            return Array.isArray(res) ? res : []
        }).catch(() => []),
        staleTime: 300_000,
    })

    const products: any[]   = productsRaw?.results || []
    const totalCount: number = productsRaw?.count || 0
    const totalPages         = Math.ceil(totalCount / 20)
    const currentPage        = Number(filters.page || 1)
    const fromCount          = (currentPage - 1) * 20 + 1
    const toCount            = Math.min(currentPage * 20, totalCount)
    const categories: any[]  = categoriesData || []
    const brands: any[]      = brandsData || []

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (value) params.set(key, value)
        else params.delete(key)
        params.delete('page')
        router.replace(`/shop?${params.toString()}`)
    }

    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (localMin) params.set('min', localMin)
        else params.delete('min')
        if (localMax) params.set('max', localMax)
        else params.delete('max')
        params.delete('page')
        router.replace(`/shop?${params.toString()}`)
    }

    const clearAllFilters = () => {
        setLocalMin('')
        setLocalMax('')
        router.replace('/shop')
    }

    const handlePage = (p: number) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.set('page', String(p))
        router.replace(`/shop?${params.toString()}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const activeFilterCount = Object.keys(filters).filter(k => !['page', 'ordering'].includes(k)).length

    // Sidebar JSX — shared between desktop and mobile
    const SidebarContent = () => (
        <div className="space-y-5">
            {/* Clear All */}
            {activeFilterCount > 0 && (
                <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 text-[#4C3B8A] text-sm font-semibold hover:underline"
                >
                    <X className="w-3.5 h-3.5" /> Clear all filters
                </button>
            )}

            {/* Price Filter */}
            <div>
                <p className="font-semibold text-sm text-gray-800 mb-3">Filter by Price</p>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={localMin}
                        onChange={e => setLocalMin(e.target.value)}
                        placeholder="Min"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                    />
                    <span className="text-gray-400 text-sm shrink-0">—</span>
                    <input
                        type="number"
                        value={localMax}
                        onChange={e => setLocalMax(e.target.value)}
                        placeholder="Max"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                    />
                </div>
                <button
                    onClick={applyPriceFilter}
                    className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-lg font-medium transition-colors"
                >
                    Apply Price
                </button>
            </div>

            {/* Categories */}
            <div>
                <button
                    onClick={() => setCatExpanded(!catExpanded)}
                    className="w-full flex items-center justify-between mb-0"
                >
                    <span className="font-semibold text-sm text-gray-800">Categories</span>
                    <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', catExpanded && 'rotate-180')} />
                </button>
                {catExpanded && (
                    <div className="space-y-2 mt-3">
                        {categories.map((cat: any) => (
                            <label key={cat.id || cat.slug} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.category === cat.slug}
                                    onChange={() => updateParam('category', filters.category === cat.slug ? '' : cat.slug)}
                                    className="accent-[#4C3B8A] w-3.5 h-3.5 shrink-0"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-[#4C3B8A] transition-colors">{cat.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Brands */}
            {brands.length > 0 && (
                <div>
                    <button
                        onClick={() => setBrandExpanded(!brandExpanded)}
                        className="w-full flex items-center justify-between"
                    >
                        <span className="font-semibold text-sm text-gray-800">Brands</span>
                        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', brandExpanded && 'rotate-180')} />
                    </button>
                    {brandExpanded && (
                        <div className="space-y-2 mt-3">
                            {brands.map((brand: any) => (
                                <label key={brand.id || brand.slug} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.brand === brand.slug}
                                        onChange={() => updateParam('brand', filters.brand === brand.slug ? '' : brand.slug)}
                                        className="accent-[#4C3B8A] w-3.5 h-3.5 shrink-0"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-[#4C3B8A] transition-colors">
                                        {brand.name}
                                        {brand.product_count !== undefined && (
                                            <span className="text-gray-400 ml-1">({brand.product_count})</span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Availability */}
            <div>
                <p className="font-semibold text-sm text-gray-800 mb-3">Availability</p>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={filters.in_stock === 'true'}
                            onChange={() => updateParam('in_stock', filters.in_stock === 'true' ? '' : 'true')}
                            className="accent-[#4C3B8A] w-3.5 h-3.5"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#4C3B8A] transition-colors">In Stock Only</span>
                    </label>
                </div>
            </div>
        </div>
    )

    return (
        <div className="bg-white min-h-screen py-3 sm:py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                {/* Breadcrumb */}
                <div className="flex items-center text-xs font-semibold text-gray-400 gap-2 mb-5">
                    <Link href="/" className="hover:text-[#4C3B8A] transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-700">Shop</span>
                </div>

                <div className="flex gap-6">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block w-[260px] shrink-0">
                        <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-4">
                            <SidebarContent />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Top Bar */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
                            {/* Left: count + mobile filter button */}
                            <div className="flex items-center gap-3">
                                {/* Mobile Filter Button */}
                                <button
                                    onClick={() => setIsMobileFiltersOpen(true)}
                                    className="md:hidden flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    Filter
                                    {activeFilterCount > 0 && (
                                        <span className="bg-[#4C3B8A] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                <p className="text-sm text-gray-600 hidden sm:block">
                                    {productsLoading ? 'Loading...' : totalCount > 0 ? (
                                        <>Showing <span className="font-semibold text-gray-900">{fromCount}–{toCount}</span> of <span className="font-semibold text-gray-900">{totalCount}</span> products</>
                                    ) : 'No products found'}
                                    {filters.search && (
                                        <> for <span className="font-semibold text-gray-900">"{filters.search}"</span></>
                                    )}
                                </p>
                            </div>

                            {/* Right: sort + view toggle */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={filters.ordering || '-created_at'}
                                    onChange={e => updateParam('sort', e.target.value)}
                                    className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4C3B8A]"
                                >
                                    {SORT_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-[#4C3B8A]/10 text-[#4C3B8A]' : 'text-gray-400 hover:text-gray-600')}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-[#4C3B8A]/10 text-[#4C3B8A]' : 'text-gray-400 hover:text-gray-600')}
                                    >
                                        <LayoutList className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        {productsLoading ? (
                            <div className={viewMode === 'grid'
                                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                                : 'space-y-3'
                            }>
                                {Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                                <SearchX className="w-14 h-14 text-gray-200 mb-4" />
                                <h3 className="font-semibold text-gray-700 mb-2">No products found</h3>
                                {filters.search && (
                                    <p className="text-sm text-gray-400 mb-4">No results for "{filters.search}"</p>
                                )}
                                <p className="text-sm text-gray-400 mb-4">Try different keywords or adjust your filters.</p>
                                <button onClick={clearAllFilters} className="text-[#4C3B8A] text-sm font-semibold hover:underline">
                                    Clear filters
                                </button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {products.map((product: any) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {products.map((product: any) => (
                                    <ProductListRow key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-1 mt-8">
                                <button
                                    onClick={() => handlePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handlePage(p)}
                                        className={cn(
                                            'w-9 h-9 text-sm font-semibold rounded-lg transition-colors',
                                            p === currentPage
                                                ? 'bg-[#4C3B8A] text-white'
                                                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Sheet */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileFiltersOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Filter Products</h3>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5">
                            <SidebarContent />
                        </div>

                        <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100">
                            <Button
                                className="w-full bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold h-12 rounded-xl"
                                onClick={() => setIsMobileFiltersOpen(false)}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// List view row component
function ProductListRow({ product }: { product: any }) {
    const primaryImage = product.images?.find((img: any) => img.is_primary)?.image_url || product.images?.[0]?.image_url || null
    const price = product.discount_price ? parseFloat(product.discount_price) : parseFloat(product.base_price)

    return (
        <Link href={`/products/${product.slug}`} className="group block">
            <div className="bg-white border border-gray-100 rounded-xl flex gap-4 p-4 hover:shadow-md transition-all">
                <div className="w-[120px] h-[120px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {primaryImage ? (
                        <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300">
                            {product.name?.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{product.category_name}</p>
                    <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-[#4C3B8A] transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 mt-2">৳{price.toLocaleString()}</p>
                    {product.discount_price && (
                        <p className="text-sm text-gray-400 line-through">৳{parseFloat(product.base_price).toLocaleString()}</p>
                    )}
                </div>
            </div>
        </Link>
    )
}
