import React from 'react'
import { Card } from '@/components/ui/card'

export function ReviewItemCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <Card className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition flex flex-col ${className}`}>
            {children}
        </Card>
    )
}

// Keeping this as a lightweight structural wrapper since domain logic is handled by specific Tabs
