'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import {
    TrendingUp, Store, Package, Grid3x3, ShoppingBag,
    Users, ClipboardCheck, ArrowUpRight, ArrowDownRight,
    CheckCircle2, Activity
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminRevenueChart } from '@/components/admin/AdminRevenueChart'

// Animated stat card with trend indicator
function MetricCard({
    title, value, icon: Icon, color, trend, href, loading
}: {
    title: string; value: string | number; icon: any
    color: string; trend?: number; href?: string; loading?: boolean
}) {
    const isPositive = (trend || 0) >= 0
    const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-100' },
        violet: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'ring-violet-100' },
        orange: { bg: 'bg-orange-50', icon: 'text-orange-600', ring: 'ring-orange-100' },
        indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-100' },
        teal: { bg: 'bg-teal-50', icon: 'text-teal-600', ring: 'ring-teal-100' },
        rose: { bg: 'bg-rose-50', icon: 'text-rose-600', ring: 'ring-rose-100' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
    }
    const c = colorMap[color] || colorMap.blue

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group relative overflow-hidden">
            {/* Subtle decorative gradient */}
            <div className={`absolute top-0 right-0 w-20 h-20 ${c.bg} rounded-bl-[40px] opacity-50 -mr-2 -mt-2`} />

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${c.icon}`} />
                    </div>
                    {href && (
                        <Link href={href} className="text-gray-300 group-hover:text-[#4C3B8A] transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <>
                        <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg mb-2" />
                        <div className="h-3 w-16 bg-gray-100 animate-pulse rounded" />
                    </>
                ) : (
                    <>
                        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-xs text-gray-400 font-medium">{title}</p>
                            {trend !== undefined && (
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                }`}>
                                    {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                    {Math.abs(trend)}%
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// Quick action button for common admin tasks
function QuickAction({ icon: Icon, label, href, color }: {
    icon: any; label: string; href: string; color: string
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
        >
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#4C3B8A] ml-auto transition-colors" />
        </Link>
    )
}

// Order/status breakdown row
function BreakdownRow({ label, value, color, loading }: {
    label: string; value: any; color?: string; loading?: boolean
}) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
                {color && <div className={`w-2 h-2 rounded-full ${color}`} />}
                <span className="text-sm text-gray-500">{label}</span>
            </div>
            {loading ? (
                <div className="h-4 w-10 bg-gray-100 animate-pulse rounded" />
            ) : (
                <span className="text-sm font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : (value || 0)}
                </span>
            )}
        </div>
    )
}

export default function AdminDashboardPage() {
    const { isAdmin, user, isAuthenticated, _hasHydrated, accessToken, setAccessToken, logout } = useAuthStore()
    const router = useRouter()
    const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true)
    const canFetchDashboardData =
        _hasHydrated && isAuthenticated && isAdmin() && !!accessToken && !isAuthBootstrapping

    // Non-admin moderators get redirected to approvals
    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    // Ensure admin pages don't fire protected queries until an access token exists.
    useEffect(() => {
        if (!_hasHydrated) return
        if (!isAuthenticated || !isAdmin()) {
            setIsAuthBootstrapping(false)
            return
        }
        if (accessToken) {
            setIsAuthBootstrapping(false)
            return
        }

        let active = true
        setIsAuthBootstrapping(true)
        api.post('/auth/token/refresh/')
            .then((res) => {
                if (!active) return
                const token =
                    res.data?.data?.access_token ||
                    res.data?.access_token ||
                    res.data?.access
                if (token) {
                    setAccessToken(token)
                    return
                }
                logout()
            })
            .catch(() => {
                if (active) logout()
            })
            .finally(() => {
                if (active) setIsAuthBootstrapping(false)
            })

        return () => { active = false }
    }, [_hasHydrated, isAuthenticated, isAdmin, accessToken, setAccessToken, logout])

    // Dashboard stats from backend
    const {
        data: stats,
        isLoading: isStatsLoading,
    } = useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async () => {
            try {
                const r = await api.get('/admin/dashboard/stats/')
                return r.data?.data || r.data || {}
            } catch {
                // Fallback route (same view) in case reverse-proxy/route edge cases hit /stats/.
                const r = await api.get('/admin/dashboard/')
                return r.data?.data || r.data || {}
            }
        },
        refetchInterval: 60_000,
        enabled: canFetchDashboardData,
    })

    // Approval counts for the pending widget
    const { data: approvalCounts } = useQuery({
        queryKey: ['admin-pending-counts'],
        queryFn: () => api.get('/admin/approvals/counts/').then(r => r.data?.data || r.data),
        refetchInterval: 60_000,
        enabled: canFetchDashboardData,
    })

    // Recent activity for the feed
    const { data: recentActivity } = useQuery({
        queryKey: ['admin-recent-activity'],
        queryFn: () => api.get('/admin/action-logs/?page_size=5').then(r => {
            const d = r.data?.data || r.data
            return d?.results || d || []
        }),
        refetchInterval: 30_000,
        enabled: canFetchDashboardData,
    })
    const isLoading = isAuthBootstrapping || (canFetchDashboardData && isStatsLoading)

    // Current greeting based on time
    const greeting = useMemo(() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 17) return 'Good Afternoon'
        return 'Good Evening'
    }, [])

    const firstName = user?.full_name?.split(' ')[0] || 'Admin'

    if (!isAdmin()) return null

    return (
        <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                        {greeting}, {firstName}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Here&apos;s what&apos;s happening on CampusHat today
                    </p>
                </div>
                <p className="text-xs text-gray-400 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Primary Metric Cards — 2x2 on mobile, 4-col on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Revenue"
                    value={`৳${(stats?.total_revenue || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    color="emerald"
                    trend={stats?.revenue_trend}
                    href="/admin/orders"
                    loading={isLoading}
                />
                <MetricCard
                    title="Total Sellers"
                    value={(stats?.total_sellers || 0).toLocaleString()}
                    icon={Store}
                    color="blue"
                    href="/admin/sellers"
                    loading={isLoading}
                />
                <MetricCard
                    title="Mall Products"
                    value={(stats?.mall_products || 0).toLocaleString()}
                    icon={Package}
                    color="teal"
                    href="/admin/mall-products"
                    loading={isLoading}
                />
                <MetricCard
                    title="Marketplace Ads"
                    value={(stats?.marketplace_listings || 0).toLocaleString()}
                    icon={Grid3x3}
                    color="violet"
                    href="/admin/marketplace"
                    loading={isLoading}
                />
            </div>

            {/* Secondary row — Orders, Users, Pending Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Orders + Users cards */}
                <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <MetricCard
                        title="Total Orders"
                        value={(stats?.total_orders || 0).toLocaleString()}
                        icon={ShoppingBag}
                        color="orange"
                        href="/admin/orders"
                        loading={isLoading}
                    />
                    <MetricCard
                        title="Registered Users"
                        value={(stats?.total_users || 0).toLocaleString()}
                        icon={Users}
                        color="indigo"
                        href="/admin/users"
                        loading={isLoading}
                    />
                </div>

                {/* Pending Approvals Widget */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-gray-900 text-base">Pending Approvals</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Items requiring your attention</p>
                        </div>
                        <Link
                            href="/admin/approvals"
                            className="text-xs font-semibold text-[#4C3B8A] hover:underline flex items-center gap-1"
                        >
                            View All <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="flex-1 space-y-1">
                        {[
                            { icon: CheckCircle2, label: 'Student Verifications', count: approvalCounts?.verifications || 0, color: 'bg-green-50 text-green-600' },
                            { icon: Store, label: 'Seller Applications', count: approvalCounts?.sellers || 0, color: 'bg-blue-50 text-blue-600' },
                            { icon: ClipboardCheck, label: 'Marketplace Ads', count: approvalCounts?.marketplace || 0, color: 'bg-purple-50 text-purple-600' },
                        ].map(item => (
                            <Link
                                key={item.label}
                                href="/admin/approvals"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#4C3B8A] transition-colors">{item.label}</p>
                                </div>
                                <span className={`text-sm font-bold ${item.count > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                                    {item.count}
                                </span>
                            </Link>
                        ))}
                    </div>
                    {(approvalCounts?.total || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-400">Total pending</span>
                            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                {approvalCounts.total}
                            </span>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-900 text-base mb-1">Quick Actions</h2>
                    <p className="text-xs text-gray-400 mb-4">Jump to common tasks</p>
                    <div className="space-y-2">
                        <QuickAction icon={ClipboardCheck} label="Review Approvals" href="/admin/approvals" color="bg-purple-50 text-purple-600" />
                        <QuickAction icon={ShoppingBag} label="Manage Orders" href="/admin/orders" color="bg-orange-50 text-orange-600" />
                        <QuickAction icon={Users} label="User Directory" href="/admin/users" color="bg-indigo-50 text-indigo-600" />
                        <QuickAction icon={Store} label="Sellers & Stores" href="/admin/sellers" color="bg-blue-50 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <AdminRevenueChart />

            {/* Bottom Grid: Order Breakdown + Marketplace Breakdown + Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Order Status Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-900 text-sm">Order Breakdown</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        <BreakdownRow label="Delivered" value={stats?.delivered_orders} color="bg-green-500" loading={isLoading} />
                        <BreakdownRow label="Pending" value={stats?.pending_orders} color="bg-yellow-500" loading={isLoading} />
                        <BreakdownRow label="Cancelled" value={stats?.cancelled_orders} color="bg-red-400" loading={isLoading} />
                        <BreakdownRow label="New Users Today" value={stats?.new_users_today} color="bg-blue-500" loading={isLoading} />
                    </div>
                </div>

                {/* Marketplace Listing Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Grid3x3 className="w-4 h-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-900 text-sm">Marketplace Breakdown</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        <BreakdownRow label="Buy & Sell" value={stats?.buy_listings} color="bg-violet-500" loading={isLoading} />
                        <BreakdownRow label="Rental" value={stats?.rental_listings} color="bg-blue-500" loading={isLoading} />
                        <BreakdownRow label="Service" value={stats?.service_listings} color="bg-teal-500" loading={isLoading} />
                        <BreakdownRow label="Food" value={stats?.food_listings} color="bg-orange-500" loading={isLoading} />
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900 text-sm">Recent Activity</h3>
                        </div>
                        <Link href="/admin/activity" className="text-xs text-[#4C3B8A] font-semibold hover:underline">
                            View All
                        </Link>
                    </div>
                    {recentActivity && recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivity.slice(0, 5).map((log: any) => (
                                <div key={log.id} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Activity className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            <span className="font-semibold">{log.admin_name || log.user_name || 'Admin'}</span>
                                            {' '}{log.description || log.action_type?.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {log.created_at ? new Date(log.created_at).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            }) : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
