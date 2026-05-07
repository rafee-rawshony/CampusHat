'use client'

import { Suspense } from 'react'
import { MarketplaceListingPage } from '@/components/marketplace/MarketplaceListingPage'

export default function FoodPage() {
    return (
        <Suspense fallback={<div className="bg-white min-h-screen" />}>
            <MarketplaceListingPage
                postType="food"
                title="Food"
                defaultMaxPrice={1000}
            />
        </Suspense>
    )
}
