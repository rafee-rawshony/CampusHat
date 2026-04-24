'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { MarketplaceListingPage } from '@/components/marketplace/MarketplaceListingPage'

// This catch-all handles /marketplace/explorer and any other dynamic types
// The explicit routes (buy, rental, services, food) take priority in Next.js App Router

const typeConfig: Record<string, { postType: string; title: string; defaultMaxPrice: number }> = {
    explorer: { postType: '', title: 'Explorer', defaultMaxPrice: 5000 },
}

export default function MarketplaceDynamicPage() {
    const params = useParams()
    const rawType = params?.type as string

    const config = typeConfig[rawType]

    if (!config) {
        // Unknown type — redirect to marketplace home
        return (
            <div className="bg-[#F5F5F5] min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 font-semibold">Page not found</p>
                    <a href="/marketplace" className="text-[#4C3B8A] hover:underline text-sm mt-2 inline-block">
                        Back to Marketplace
                    </a>
                </div>
            </div>
        )
    }

    return (
        <Suspense fallback={<div className="bg-[#F5F5F5] min-h-screen" />}>
            <MarketplaceListingPage
                postType={config.postType}
                title={config.title}
                defaultMaxPrice={config.defaultMaxPrice}
            />
        </Suspense>
    )
}
