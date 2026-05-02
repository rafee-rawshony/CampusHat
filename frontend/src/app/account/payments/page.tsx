'use client'

import { CreditCard } from 'lucide-react'
import { ComingSoon } from '@/components/account/ComingSoon'

export default function PaymentsPage() {
    return (
        <ComingSoon
            title="My Payment Options"
            description="Save your bKash, Nagad, Rocket, or card details for faster checkout."
            icon={CreditCard}
        />
    )
}
