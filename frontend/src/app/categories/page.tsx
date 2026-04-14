'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ChevronRight, SearchX } from 'lucide-react'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'

export default function CategoriesRootPage() {
    // Fetch all products since no specific category is selected
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['mall-products-all'],
        queryFn: () => api.get('/mall/products/', { params: { is_active: true } }).then(r => { 
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; 
            return Array.isArray(res) ? res : [] 
        }),
    })

    const products = productsData || []

    return (
        <>
            {/* Breadcrumbs */}
            <div className="flex items-center text-xs font-bold text-gray-400 gap-2 mb-2">
                <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-900">Categories</span>
            </div>

            {/* Header Region */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">
                    ALL PRODUCTS
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
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <SearchX className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No products found</h3>
                    <p className="text-sm font-medium text-gray-500 max-w-sm">
                        Please check back later or browse specific categories from the sidebar.
                    </p>
                    <Link href="/">
                        <button className="mt-6 bg-brand-primary text-white font-bold px-6 py-2.5 rounded-full hover:bg-brand-dark transition-all">
                            Back to Homepage
                        </button>
                    </Link>
                </div>
            )}
        </>
    )
}
