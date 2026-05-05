'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { SellerOrderTable } from '@/components/seller/orders/SellerOrderTable'
import { cn } from '@/lib/utils'
import { normalizeListResponse } from '@/lib/response'

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'placed', label: 'Placed' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'packed', label: 'Packed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
]

export default function SellerOrdersPage() {
    const [activeTab, setActiveTab] = useState('all')

    const { data: counts } = useQuery({
        queryKey: ['seller-order-counts'],
        queryFn: () => api.get('/seller/orders/counts/').then(r => r.data?.data || r.data).catch(() => ({})),
        staleTime: 30_000,
    })

    const { data, isLoading } = useQuery({
        queryKey: ['seller-orders', activeTab],
        queryFn: () => {
            const params = new URLSearchParams({ ordering: '-created_at' })
            if (activeTab !== 'all') params.set('status', activeTab)
            return api.get(`/seller/orders/?${params}`).then(r => normalizeListResponse(r.data))
        },
        staleTime: 30_000,
    })

    const orders = normalizeListResponse<any>(data)

    return (
        <div>
            <h1 className="font-bold text-xl text-gray-900 mb-5">Order Management</h1>

            {/* Status Tabs */}
            <div className="flex gap-1 border-b border-gray-100 mb-5 overflow-x-auto custom-scrollbar pb-0">
                {TABS.map(tab => {
                    const count = tab.id === 'all' ? counts?.all : counts?.[tab.id]
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 -mb-px',
                                isActive
                                    ? 'border-[#4C3B8A] text-[#4C3B8A]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            {tab.label}
                            {count !== undefined && (
                                <span className={cn(
                                    'text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none',
                                    count > 0
                                        ? (isActive ? 'bg-[#4C3B8A] text-white' : 'bg-[#4C3B8A]/10 text-[#4C3B8A]')
                                        : 'bg-gray-100 text-gray-400'
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Orders Table */}
            <SellerOrderTable orders={orders} isLoading={isLoading} />
        </div>
    )
}
