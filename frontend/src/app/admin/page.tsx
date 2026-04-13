'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { TrendingUp, Store, Grid3x3, ShoppingBag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { AdminQuickStats } from '@/components/admin/AdminQuickStats'
import { AdminRevenueChart } from '@/components/admin/AdminRevenueChart'

export default function AdminDashboardPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [isAdmin, router])

    const { data: adminStats, isLoading } = useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: () => api.get('/admin/dashboard/stats/').then(r => r.data?.data || r.data),
        refetchInterval: 60_000,
    })

    if (!isAdmin()) return null // Prevent flash before redirect

    return (
        <div className="max-w-6xl space-y-2 pb-10">
            {/* ROW 1: STAT CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatCard
                    title="Total Revenue"
                    value={`৳${(adminStats?.total_revenue || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    subtitle="Platform earnings"
                    insightHref="/admin/revenue"
                    loading={isLoading}
                />
                <AdminStatCard
                    title="Total Sellers"
                    value={(adminStats?.total_sellers || 0).toLocaleString()}
                    icon={Store}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    subtitle="Approved sellers"
                    insightHref="/admin/users?role=seller"
                    loading={isLoading}
                />
                <AdminStatCard
                    title="Mall Products"
                    value={(adminStats?.mall_products || 0).toLocaleString()}
                    icon={Package}
                    iconBg="bg-teal-100"
                    iconColor="text-teal-600"
                    subtitle="Active listings"
                    insightHref="/admin/mall-products"
                    loading={isLoading}
                />
                <AdminStatCard
                    title="Marketplace Ads"
                    value={(adminStats?.marketplace_listings || 0).toLocaleString()}
                    icon={Grid3x3}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                    subtitle="Active C2C ads"
                    insightHref="/admin/marketplace"
                    loading={isLoading}
                />
            </div>

            {/* ROW 2: WIDE OR EXTRA STAT CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <AdminStatCard
                    title="Total Orders"
                    value={(adminStats?.total_orders || 0).toLocaleString()}
                    icon={ShoppingBag}
                    iconBg="bg-red-100"
                    iconColor="text-red-600"
                    subtitle="All time orders"
                    insightHref="/admin/orders"
                    loading={isLoading}
                />
            </div>

            {/* REVENUE CHART */}
            <AdminRevenueChart />

            {/* QUICK STATS TABLE */}
            <AdminQuickStats stats={adminStats || {}} isLoading={isLoading} />
        </div>
    )
}

// Temporary icon definition for Package since I used it but forgot to import it above.
// Fixing by swapping imported icon.
import { Package } from 'lucide-react'
