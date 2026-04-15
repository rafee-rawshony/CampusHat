'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { ChevronRight, SearchX, Package } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
    { label: 'Latest Arrivals', value: '-created_at' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
    { label: 'Best Rating', value: '-rating_avg' },
    { label: 'Most Popular', value: '-sold_count' },
]

export default function CategorySlugPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" /></div>}>
            <CategorySlugContent />
        </React.Suspense>
    )
}

function CategorySlugContent() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const slug = params?.slug as string

    const sort = searchParams?.get('sort') || '-created_at'
    const page = searchParams?.get('page') || '1'

    const { data: categoriesData } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () =>
            api.get('/mall/categories/').then(r => {
                const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data
                return Array.isArray(res) ? res : []
            }),
        staleTime: 300_000,
    })

    const { data: productsRaw, isLoading: productsLoading } = useQuery({
        queryKey: ['category-products', slug, sort, page],
        queryFn: () =>
            api.get('/mall/products/', {
                params: { category: slug, is_active: true, ordering: sort, page, page_size: 20 }
            }).then(r => {
                const data = r.data
                // Handle both paginated and plain array responses
                if (data?.results) return { results: data.results, count: data.count }
                if (Array.isArray(data)) return { results: data, count: data.length }
                if (data?.data?.results) return { results: data.data.results, count: data.data.count }
                return { results: [], count: 0 }
            }),
        enabled: !!slug,
    })

    const categories: any[] = categoriesData || []
    const products: any[] = productsRaw?.results || []
    const totalCount: number = productsRaw?.count || 0
    const totalPages = Math.ceil(totalCount / 20)

    const currentCategory = categories.find((c: any) => c.slug === slug)

    const handleSort = (value: string) => {
        const p = new URLSearchParams(searchParams?.toString() || '')
        p.set('sort', value)
        p.delete('page')
        router.replace(`/categories/${slug}?${p.toString()}`)
    }

    const handlePage = (newPage: number) => {
        const p = new URLSearchParams(searchParams?.toString() || '')
        p.set('page', String(newPage))
        router.replace(`/categories/${slug}?${p.toString()}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Breadcrumb */}
                <div className="flex items-center text-xs font-semibold text-gray-400 gap-2 mb-5">
                    <Link href="/" className="hover:text-[#4C3B8A] transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/categories" className="hover:text-[#4C3B8A] transition-colors">Categories</Link>
                    {currentCategory && (
                        <>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-gray-700">{currentCategory.name}</span>
                        </>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Desktop Left Sidebar */}
                    <aside className="hidden lg:block w-[220px] shrink-0">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <h2 className="font-semibold text-sm text-gray-800">Product Categories</h2>
                            </div>
                            <nav className="py-1">
                                {categories.map((cat: any) => {
                                    const isActive = cat.slug === slug
                                    const IconComp = cat.icon ? (LucideIcons as any)[cat.icon] : LucideIcons.Tag
                                    return (
                                        <button
                                            key={cat.id || cat.slug}
                                            onClick={() => router.push(`/categories/${cat.slug}`)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                                                isActive
                                                    ? 'bg-[#4C3B8A] text-white font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50 font-normal'
                                            )}
                                        >
                                            {IconComp && (
                                                <IconComp className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
                                            )}
                                            <span className="line-clamp-1">{cat.name}</span>
                                        </button>
                                    )
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile: Horizontal Category Chips */}
                        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 custom-scrollbar">
                            {categories.map((cat: any) => (
                                <Link
                                    key={cat.slug}
                                    href={`/categories/${cat.slug}`}
                                    className={cn(
                                        'whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0',
                                        cat.slug === slug
                                            ? 'bg-[#4C3B8A] text-white border-[#4C3B8A]'
                                            : 'border-gray-200 text-gray-600 bg-white hover:border-[#4C3B8A] hover:text-[#4C3B8A]'
                                    )}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>

                        {/* Category Header Box */}
                        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-4">
                            <h1 className="font-bold text-2xl text-gray-900">
                                {currentCategory?.name || slug?.replace(/-/g, ' ')}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {productsLoading ? '...' : `${totalCount} products found`}
                            </p>
                        </div>

                        {/* Sort Bar */}
                        <div className="flex justify-end mb-4">
                            <select
                                value={sort}
                                onChange={e => handleSort(e.target.value)}
                                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4C3B8A]"
                            >
                                {SORT_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Products Grid */}
                        {productsLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                                <Package className="w-14 h-14 text-gray-200 mb-4" />
                                <h3 className="font-semibold text-gray-700 mb-2">No products in this category</h3>
                                <p className="text-sm text-gray-400">Check back later or browse other categories.</p>
                                <Link href="/categories" className="mt-4 text-[#4C3B8A] text-sm font-semibold hover:underline">
                                    ← All Categories
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.map((product: any) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-1 mt-8">
                                <button
                                    onClick={() => handlePage(Number(page) - 1)}
                                    disabled={page === '1'}
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
                                            String(p) === page
                                                ? 'bg-[#4C3B8A] text-white'
                                                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePage(Number(page) + 1)}
                                    disabled={Number(page) >= totalPages}
                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
