'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatsRow } from '@/components/seller/dashboard/StatsRow'
import { RevenueChart } from '@/components/seller/dashboard/RevenueChart'
import { RecentOrdersTable } from '@/components/seller/dashboard/RecentOrdersTable'

export default function SellerDashboardPage() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['seller-stats'],
        queryFn: () => api.get('/sellers/my-dashboard/').then(r => r.data?.data || r.data),
        staleTime: 0,
        refetchInterval: 30_000,
    })

    return (
        <div>
            {/* Page Title */}
            <div className="mb-6">
                <h1 className="font-bold text-2xl text-gray-900">Dashboard Overview</h1>
                <p className="text-sm text-gray-400 mt-1">Track your store performance and activity</p>
            </div>

            {/* Stats Row */}
            <StatsRow stats={stats} isLoading={statsLoading} />

            {/* Revenue Chart */}
            <RevenueChart />

            {/* Recent Orders */}
            <RecentOrdersTable />
        </div>
    )
}
