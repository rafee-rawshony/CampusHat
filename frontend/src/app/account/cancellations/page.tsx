'use client'

import { XCircle } from 'lucide-react'
import { ComingSoon } from '@/components/account/ComingSoon'

export default function CancellationsPage() {
    return (
        <ComingSoon
            title="My Cancellations"
            description="View and track orders you've cancelled."
            icon={XCircle}
        />
    )
}
