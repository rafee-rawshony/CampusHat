'use client'

import { RotateCcw } from 'lucide-react'
import { ComingSoon } from '@/components/account/ComingSoon'

export default function ReturnsPage() {
    return (
        <ComingSoon
            title="My Returns"
            description="Track items you've returned and refund status."
            icon={RotateCcw}
        />
    )
}
