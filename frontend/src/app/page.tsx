'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useModeStore } from '@/stores/mode.store'
import { HeroCarousel } from '@/components/mall/HeroCarousel'
import { FlashSaleSection } from '@/components/mall/FlashSaleSection'
import { TopCategoriesSection } from '@/components/mall/TopCategoriesSection'
import { FeaturedSellersSection } from '@/components/mall/FeaturedSellersSection'

export default function MallHomePage() {
    const router = useRouter()
    const { mode } = useModeStore()
    const [isMounted, setIsMounted] = useState(false)

    // Mount check to prevent hydration mismatch with Zustand persist
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Mode Guard
    useEffect(() => {
        if (isMounted && mode === 'marketplace') {
            router.push('/marketplace')
        }
    }, [mode, router, isMounted])

    if (!isMounted) return null

    // If marketplace mode, return null to prevent flash of mall content before redirect engages
    if (mode === 'marketplace') return null

    return (
        <div className="bg-white min-h-screen pb-20 pt-4 md:pt-8 w-full overflow-x-hidden">
            <main>
                <HeroCarousel />
                <FlashSaleSection />
                <TopCategoriesSection />
                <FeaturedSellersSection />
            </main>
        </div>
    )
}
