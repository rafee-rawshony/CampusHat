'use client'

import { Store } from 'lucide-react'
import { ComingSoon } from '@/components/account/ComingSoon'

export default function FollowedStoresPage() {
    return (
        <ComingSoon
            title="Followed Stores"
            description="Stay updated on new arrivals and offers from stores you follow."
            icon={Store}
        />
    )
}
