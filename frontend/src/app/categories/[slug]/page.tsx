'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { ChevronRight, SearchX } from 'lucide-react'

export default function CategoryPage() {
    const params = useParams()
    const slug = params?.slug as string

    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['category-products', slug],
        queryFn: () => api.get(`/mall/products/?category=${slug}`).then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] }),
    })

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] }),
        staleTime: 300_000,
    })

    const products = productsData || []
    const categories = categoriesData || []

    const currentCategory = categories.find((c: any) => c.slug === slug)

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
                {/* LEFT SIDEBAR: Categories List */}
                <aside className="w-full md:w-[260px] shrink-0 space-y-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h2 className="font-black text-gray-900 text-lg mb-4">Product Categories</h2>
                        <ul className="space-y-1">
                            {categoriesLoading ? (
                                Array(5).fill(null).map((_, i) => (
                                    <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse mb-2"></div>
                                ))
                            ) : (
                                categories.map((cat: any) => (
                                    <li key={cat.id || cat.slug}>
                                        <Link 
                                            href={`/categories/${cat.slug}`}
                                            className={`block px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                                slug === cat.slug 
                                                    ? 'bg-brand-primary text-white' 
                                                    : 'text-gray-600 hover:bg-brand-primary/10 hover:text-brand-primary'
                                            }`}
                                        >
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </aside>

                {/* RIGHT CONTENT: Products */}
                <main className="flex-1 space-y-6">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-xs font-bold text-gray-400 gap-2">
                        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/categories" className="hover:text-brand-primary transition-colors">Categories</Link>
                        {currentCategory && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-gray-900">{currentCategory.name}</span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">
                            {currentCategory ? currentCategory.name : (slug ? slug.replace(/-/g, ' ') : 'Category')}
                        </h1>
                        <p className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                            {productsLoading ? '...' : products.length} products found
                        </p>
                    </div>

                    {productsLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {Array(8).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <SearchX className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">No products found</h3>
                            <p className="text-sm font-medium text-gray-500 max-w-sm">
                                We couldn&apos;t find any products in this category yet. Please check back later or browse other categories.
                            </p>
                            <Link href="/">
                                <button className="mt-6 bg-brand-primary text-white font-bold px-6 py-2.5 rounded-full hover:bg-brand-dark transition-all">
                                    Back to Homepage
                                </button>
                            </Link>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
