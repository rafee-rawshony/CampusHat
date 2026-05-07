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
                    ordering: '-created_at'
                }
            })
            const d = res.data?.data ?? res.data
            return Array.isArray(d) ? d : (d?.results ?? [])
        },
        staleTime: 60_000,
    })

    const products: Product[] = productsRaw || []

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-10">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="font-bold text-xl text-gray-900">Our Products</h2>
                    <p className="text-gray-500 text-sm mt-1 sm:block hidden">
                        Discover completely verified, quality listings ready for checkout.
                    </p>
                </div>
                <Link href="/shop" className="text-[#4C3B8A] text-sm font-semibold hover:underline shrink-0 pb-0.5">
                    View All →
                </Link>
            </div>

            {/* Error State */}
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
                /* Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                    {isLoading
                        ? Array(12).fill(null).map((_, i) => (
                            <div key={i} className="w-full">
                                <ProductCardSkeleton />
                            </div>
                        ))
                        : products.map((product) => (
                            <div key={product.id} className="w-full">
                                <ProductCard product={product} />
                            </div>
                        ))
                    }
                </div>
            )}

            {/* Empty State protection (if API succeeds but returns empty array) */}
            {!isLoading && !isError && products.length === 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center text-gray-500">
                    No products available right now. Check back soon!
                </div>
            )}

            {/* Bottom CTA */}
            {!isError && products.length > 0 && (
                <div className="mt-8 flex justify-center">
                    <Link
                        href="/shop"
                        className="border-2 border-[#4C3B8A] text-[#4C3B8A] font-semibold px-8 py-3 rounded-xl hover:bg-[#4C3B8A] hover:text-white transition inline-block text-sm sm:text-base text-center w-full sm:w-auto"
                    >
                        View All Products
                    </Link>
                </div>
            )}
        </div>
    )
}
