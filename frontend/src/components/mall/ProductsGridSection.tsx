'use client'

import Link from 'next/link'
import { RotateCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton, Product } from './ProductCard'

export function ProductsGridSection() {
    const { data: productsRaw, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['homepage-products'],
        queryFn: async () => {
            const res = await api.get('/mall/products/', {
                params: {
                    is_active: true,
                    page: 1,
                    page_size: 12,
                    ordering: '-sold_count,-created_at',
                }
            })
            const d = res.data?.data ?? res.data
            return Array.isArray(d) ? d : (d?.results ?? [])
        },
        staleTime: 60_000,
    })

    const products: Product[] = productsRaw || []

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 mb-8 sm:mb-12 mt-6 sm:mt-16 pt-2 sm:pt-6">

            {/* Centered Header */}
            <div className="text-center mb-4 sm:mb-8">
                <h2 className="font-bold text-xl sm:text-2xl md:text-3xl text-gray-900 leading-tight">Our Products</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 px-4">Discover a wide range of products available in our store.</p>
            </div>

            {/* Error */}
            {isError ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center flex flex-col items-center">
                    <p className="text-red-600 font-medium mb-4">Could not load products. Try again.</p>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition active:scale-95 disabled:opacity-50"
                    >
                        <RotateCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Retry
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {isLoading
                        ? Array(8).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
                        : products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    }
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && products.length === 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center text-gray-500">
                    No products available right now. Check back soon!
                </div>
            )}

            {/* CTA */}
            {!isError && products.length > 0 && (
                <div className="mt-6 sm:mt-8 flex justify-center">
                    <Link
                        href="/shop"
                        className="border-2 border-[#4C3B8A] text-[#4C3B8A] font-semibold px-8 sm:px-10 py-2.5 sm:py-3 rounded-xl hover:bg-[#4C3B8A] hover:text-white active:scale-95 transition text-sm"
                    >
                        View All Products
                    </Link>
                </div>
            )}
        </div>
    )
}
