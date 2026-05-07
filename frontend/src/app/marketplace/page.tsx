'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { VerificationRequiredCard } from '@/components/auth/VerificationRequiredCard'
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero'
import { CategoryCards } from '@/components/marketplace/CategoryCards'
import { ListingSection } from '@/components/marketplace/ListingSection'

export default function MarketplaceHomepage() {
    const router = useRouter()
    const { canAccessMarketplace } = useAuthStore()
    const [showVerificationCard, setShowVerificationCard] = useState(false)

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Hero */}
            <MarketplaceHero />

            <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12">
                {/* Category Cards */}
                <CategoryCards />

                {/* Listing Sections */}
                <ListingSection
                    title="Recent Items for Sale"
                    postType="sell"
                    viewAllHref="/marketplace/buy"
                />
                <ListingSection
                    title="Latest Rental Ads"
                    postType="rent"
                    viewAllHref="/marketplace/rental"
                />
                <ListingSection
                    title="Available Services"
                    postType="service"
                    viewAllHref="/marketplace/services"
                />
                <ListingSection
                    title="Homemade Food & Meals"
                    postType="food"
                    viewAllHref="/marketplace/food"
                />
            </div>

            {/* FAB — Mobile only */}
            <button
                onClick={() => {
                    if (!canAccessMarketplace()) {
                        setShowVerificationCard(true)
                        return
                    }
                    router.push('/marketplace/post')
                }}
                className="fixed sm:hidden z-40 right-4 bottom-[76px]
                    w-14 h-14 rounded-full bg-brand-primary text-white
                    shadow-lg shadow-brand-primary/30
                    flex items-center justify-center
                    active:scale-95 transition-transform"
                aria-label="Post new ad"
            >
                <Plus className="w-7 h-7" />
            </button>

            <VerificationRequiredCard
                isOpen={showVerificationCard}
                onClose={() => setShowVerificationCard(false)}
            />
        </div>
    )
}
