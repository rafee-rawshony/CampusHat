'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StatsRow } from '@/components/seller/dashboard/StatsRow'
import { QuickActions } from '@/components/seller/dashboard/QuickActions'
import { RevenueChart } from '@/components/seller/dashboard/RevenueChart'
import { RecentOrdersTable } from '@/components/seller/dashboard/RecentOrdersTable'

export default function SellerDashboardPage() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['seller-stats'],
        queryFn: () => api.get('/sellers/my-dashboard/').then(r => r.data?.data || r.data),
        staleTime: 30_000,
        refetchInterval: 30_000,
    })

    return (
        <div>
            {/* Page Title */}
            <div className="mb-6">
                <h1 className="font-bold text-2xl text-gray-900">
                    Welcome back{stats?.business_name ? `, ${stats.business_name}` : ''}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Track your store performance and activity at a glance.</p>
            </div>

            {/* Quick Actions row */}
            <QuickActions />

            {/* Daraz-style KPI grid (Products + Orders + Rating) */}
            <StatsRow stats={stats} isLoading={statsLoading} />

            {/* Revenue Chart */}
            <RevenueChart />

            {/* Recent Orders */}
            <RecentOrdersTable />
        </div>
    )
}
