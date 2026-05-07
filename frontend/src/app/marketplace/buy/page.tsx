'use client'

import { Suspense } from 'react'
import { MarketplaceListingPage } from '@/components/marketplace/MarketplaceListingPage'

export default function BuyPage() {
    return (
        <Suspense fallback={<div className="bg-white min-h-screen" />}>
            <MarketplaceListingPage
                postType="sell"
                title="Buy"
                defaultMaxPrice={1000}
            />
        </Suspense>
    )
}
