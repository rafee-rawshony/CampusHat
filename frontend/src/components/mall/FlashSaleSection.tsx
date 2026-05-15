'use client'

import Link from 'next/link'
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 mb-4 sm:mb-8">
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2 sm:gap-3 flex-wrap">
                    <div className="shrink-0">
                        <h2 className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">Flash Sell</h2>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">Grab these deals before they&apos;re gone!</p>
                    </div>

                    {flashSale?.ends_at && (
                        <div className="grow flex justify-center order-3 sm:order-2 w-full sm:w-auto">
                            <CountdownTimer targetDate={flashSale.ends_at} />
                        </div>
                    )}

                    <Link
                        href="/shop?flash=true"
                        className="text-[#4C3B8A] text-xs sm:text-sm font-semibold hover:underline shrink-0 border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 order-2 sm:order-3 active:scale-95 transition-transform"
                    >
                        View All →
                    </Link>
                </div>

                {/* Horizontal scroll */}
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-x snap-x snap-mandatory sm:snap-none -mx-1 px-1">
                    {isLoading
                        ? Array(6).fill(null).map((_, i) => (
                            <div key={i} className="w-[140px] sm:w-[200px] shrink-0 snap-start">
                                <ProductCardSkeleton />
                            </div>
                        ))
                        : items.map((item: any) => (
                            <div key={item.id} className="snap-start">
                                <FlashSaleProductCard item={item} />
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
