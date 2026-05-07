'use client'

import { Suspense } from 'react'
import { MarketplaceListingPage } from '@/components/marketplace/MarketplaceListingPage'

export default function RentalPage() {
    return (
        <Suspense fallback={<div className="bg-white min-h-screen" />}>
            <MarketplaceListingPage
                postType="rent"
                title="Rental"
                defaultMaxPrice={2000}
            />
        </Suspense>
    )
}
