'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { ChevronRight, SearchX } from 'lucide-react'

export default function CategorySlugPage() {
    const params = useParams()
    const slug = params?.slug as string

    // Fetch products belonging uniquely to this category
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['category-products', slug],
        queryFn: () => api.get(`/mall/products/?category=${slug}&is_active=true`).then(r => { 
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; 
            return Array.isArray(res) ? res : [] 
        }),
    })

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => { 
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; 
            return Array.isArray(res) ? res : [] 
        }),
        staleTime: 300_000,
    })

    const products = productsData || []
    const categories = categoriesData || []

    const currentCategory = categories.find((c: any) => c.slug === slug)

    return (
        <>
            {/* Breadcrumbs */}
            <div className="flex items-center text-xs font-bold text-gray-400 gap-2 mb-2">
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

            {/* Header Region */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">
                    {currentCategory ? currentCategory.name : (slug ? slug.replace(/-/g, ' ') : 'Category')}
                </h1>
                <p className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    {productsLoading ? '...' : products.length} products found
                </p>
            </div>

            {/* Products Grid */}
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
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <SearchX className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No products found</h3>
                    <p className="text-sm font-medium text-gray-500 max-w-sm">
                        We couldn&apos;t find any products in this category yet. Please check back later or browse other categories.
                    </p>
                    <Link href="/categories">
                        <button className="mt-6 bg-[#634C9F] text-white font-bold px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all">
                            Back to Categories
                        </button>
                    </Link>
                </div>
            )}
        </>
    )
}
