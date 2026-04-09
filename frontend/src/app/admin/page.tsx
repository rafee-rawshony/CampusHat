'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'



import {
    DollarSign, Users, Store, Grid, ShoppingBag,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

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
        queryFn: () => api.get('/admin/dashboard/').then(r => r.data?.data || r.data || {}),
        refetchInterval: 60_000,
    })

    const statCards = [
        { label: 'TOTAL REVENUE', value: `৳${Number(adminStats?.total_revenue_today || 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/admin/revenue' },
        { label: 'TOTAL SELLERS', value: adminStats?.total_sellers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', link: '/admin/users?role=seller' },
        { label: 'ACTIVE STORES', value: adminStats?.active_stores || 0, icon: Store, color: 'text-teal-500', bg: 'bg-teal-50', link: '/admin/mall-products' },
        { label: 'MARKETPLACE LISTINGS', value: adminStats?.total_marketplace_ads || 0, icon: Grid, color: 'text-purple-500', bg: 'bg-purple-50', link: '/admin/marketplace' },
    ]

    if (isLoading) {
        return (
            <div className="p-8 animate-pulse space-y-8 max-w-6xl">
                <div className="h-10 bg-gray-200 rounded w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Overview</h1>

            {/* Main Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        </div>
                        <Link href={stat.link} className="mt-4 text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1 hover:text-brand-dark group w-fit">
                            INSIGHT <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Total Orders Box */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow lg:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL ORDERS</p>
                        <p className="text-3xl font-black text-gray-900">{adminStats?.total_orders_today || 0}</p>
                    </div>
                    <Link href="/admin/orders" className="mt-4 text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1 hover:text-brand-dark group w-fit">
                        INSIGHT <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Quick Stats Panel */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
                    <h2 className="text-base font-black text-gray-900 mb-4">Quick Stats</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Verified Students', val: adminStats?.verified_students },
                            { label: 'Pending Approvals', val: adminStats?.pending_approvals_count },
                            { label: 'Pending Refunds', val: adminStats?.pending_refunds },
                            { label: 'Pending Verifications', val: adminStats?.pending_verifications },
                            { label: 'Platform Wallet', val: `৳${Number(adminStats?.platform_wallet_balance || 0).toFixed(2)}` },
                        ].map((row, i) => (
                            <div key={i} className="flex items-end gap-2 text-sm">
                                <span className="font-bold text-gray-600 whitespace-nowrap">{row.label}:</span>
                                <div className="flex-1 border-b-[3px] border-dotted border-gray-200 mb-1 opacity-50"></div>
                                <span className="font-black text-gray-900">{row.val || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
