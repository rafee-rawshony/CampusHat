import React from 'react'
import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    placed:    { label: 'Placed',     className: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed',  className: 'bg-blue-100 text-blue-700' },
    packed:    { label: 'Packed',     className: 'bg-indigo-100 text-indigo-700' },
    shipped:   { label: 'Shipped',    className: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Delivered',  className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled',  className: 'bg-red-100 text-red-500' },
}

export function OrderStatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] || { label: status, className: 'bg-gray-100 text-gray-500' }
    return (
        <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap', s.className)}>
            {s.label}
        </span>
    )
}
