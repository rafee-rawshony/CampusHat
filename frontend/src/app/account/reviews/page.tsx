'use client'

import { Star } from 'lucide-react'
import { ComingSoon } from '@/components/account/ComingSoon'

export default function ReviewsPage() {
    return (
        <ComingSoon
            title="My Reviews"
            description="See all the reviews you've left for products and stores."
            icon={Star}
        />
    )
}
