'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { FlashSaleProductCard } from './FlashSaleProductCard'
import { ProductCardSkeleton } from './ProductCard'

export function FlashSaleSection() {
    const { data: flashSale, isLoading } = useQuery({
        queryKey: ['flash-sales-active'],
        queryFn: async () => {
            const res = await api.get('/flash-sales/active/')
            const d = res.data?.data ?? res.data
            // API may return a single object or an array; handle both
            if (Array.isArray(d)) return d.length > 0 ? d[0] : null
            if (d?.results) return d.results.length > 0 ? d.results[0] : null
            return d?.id ? d : null
        },
        staleTime: 60_000,
    })

    // If no active flash sale, hide entirely
    if (!isLoading && !flashSale) return null

    const items = flashSale?.products || []

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-10">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Zap className="w-5 h-5 text-[#EF4444] fill-current" />
                        <h2 className="font-bold text-xl text-gray-900">Flash Sale</h2>
                        {flashSale?.ends_at && (
                            <div className="ml-2">
                                <CountdownTimer targetDate={flashSale.ends_at} />
                            </div>
                        )}
                    </div>
                    <Link
                        href="/shop?flash=true"
                        className="text-[#4C3B8A] text-sm font-semibold hover:underline shrink-0"
                    >
                        View All →
                    </Link>
                </div>

                {/* Horizontal scroll */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {isLoading
                        ? Array(6).fill(null).map((_, i) => (
                            <div key={i} className="w-[160px] sm:w-[200px] shrink-0">
                                <ProductCardSkeleton />
                            </div>
                        ))
                        : items.map((item: any) => (
                            <FlashSaleProductCard key={item.id} item={item} />
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
