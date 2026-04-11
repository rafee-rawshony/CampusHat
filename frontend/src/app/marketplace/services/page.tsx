'use client'

import { Suspense } from 'react'
import { MarketplaceListingPage } from '@/components/marketplace/MarketplaceListingPage'

export default function ServicesPage() {
    return (
        <Suspense fallback={<div className="bg-[#F5F5F5] min-h-screen" />}>
            <MarketplaceListingPage
                postType="service"
                title="Services"
                defaultMaxPrice={200}
            />
        </Suspense>
    )
}
