'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'

interface RelatedProductsProps {
    currentProductId: string
    categorySlug: string
    categoryName: string
}

export function RelatedProducts({ currentProductId, categorySlug, categoryName }: RelatedProductsProps) {
    const { data: productsRaw, isLoading } = useQuery({
        queryKey: ['related-products', categorySlug, currentProductId],
        queryFn: async () => {
            const res = await api.get('/mall/products/', {
                params: {
                    category: categorySlug,
                    page_size: 7, // Fetching 7 just in case one of them is the current product itself
                    ordering: '-sold_count',
                    is_active: true
                }
            })
            const d = res.data?.data ?? res.data
            return Array.isArray(d) ? d : (d?.results ?? [])
        },
        staleTime: 300_000,
    })

    const relatedProducts = (productsRaw || [])
        .filter((p: any) => p.id !== currentProductId)
        .slice(0, 6)

    // Hide section entirely if no related items found
    if (!isLoading && relatedProducts.length === 0) return null

    return (
        <section className="max-w-7xl mx-auto px-4 lg:px-6 mb-16 pt-10">
            <div className="mb-6">
                <h2 className="font-black text-2xl text-gray-900 leading-tight">You Might Also Like</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">More from {categoryName}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                {isLoading
                    ? Array(6).fill(null).map((_, i) => (
                        <div key={i} className="w-full">
                            <ProductCardSkeleton />
                        </div>
                    ))
                    : relatedProducts.map((product: any) => (
                        <div key={product.id} className="w-full">
                            <ProductCard product={product} />
                        </div>
                    ))
                }
            </div>
        </section>
    )
}
