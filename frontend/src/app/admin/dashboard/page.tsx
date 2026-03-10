'use client'

import React, { useEffect, useState } from 'react'
import {
    Users, Store, ShoppingBag, Grid, ShieldCheck,
    DollarSign, TrendingUp, ArrowRight, Clock, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'

export default function AdminDashboardPage() {
    const { isAdmin } = useAuthStore()
    const { hasPermission } = useAdminStore()
    const [stats, setStats] = useState<any>(null)
    const [activity, setActivity] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // API: GET /api/v1/admin/stats/
        // API: GET /api/v1/admin/activity/
        setTimeout(() => {
            setStats({
                total_users: 12847,
                users_trend: 5.2,
                active_sellers: 342,
                sellers_trend: 11.3,
                mall_orders_today: 87,
                orders_trend: -3.4,
                marketplace_ads: 1423,
                ads_trend: 8.7,
                pending_verifications: 12,
                verifications_trend: -1.2,
                revenue_today: 185400,
                revenue_trend: 22.1,
            })
            setActivity([
                { admin: 'Rahim (Admin)', action: 'Approved Seller', resource: 'TechHub Store', time: '2 mins ago', type: 'approve' },
                { admin: 'Sadia (Mod)', action: 'Rejected Ad', resource: 'iPhone 14 Pro Listing', time: '10 mins ago', type: 'reject' },
                { admin: 'Rahim (Admin)', action: 'Suspended User', resource: 'user@diu.edu.bd', time: '1 hour ago', type: 'suspend' },
                { admin: 'Karim (Admin)', action: 'Approved Verification', resource: 'Ayesha - DU Student', time: '2 hours ago', type: 'approve' },
                { admin: 'Rahim (Admin)', action: 'Role Changed', resource: 'seller → admin', time: '3 hours ago', type: 'change' },
            ])
            setIsLoading(false)
        }, 700)
    }, [])

    const statCardsData = [
        { label: 'Total Users', value: stats?.total_users?.toLocaleString(), trend: stats?.users_trend, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', visible: true },
        { label: 'Active Sellers', value: stats?.active_sellers?.toLocaleString(), trend: stats?.sellers_trend, icon: Store, color: 'text-purple-600', bg: 'bg-purple-50', visible: true },
        { label: 'Mall Orders Today', value: stats?.mall_orders_today, trend: stats?.orders_trend, icon: ShoppingBag, color: 'text-teal-600', bg: 'bg-teal-50', visible: hasPermission('admin') },
        { label: 'Marketplace Ads', value: stats?.marketplace_ads?.toLocaleString(), trend: stats?.ads_trend, icon: Grid, color: 'text-orange-600', bg: 'bg-orange-50', visible: true },
        { label: 'Pending Verifications', value: stats?.pending_verifications, trend: stats?.verifications_trend, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50', visible: hasPermission('admin') },
        { label: 'Revenue Today', value: `৳${stats?.revenue_today?.toLocaleString()}`, trend: stats?.revenue_trend, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', visible: hasPermission('admin') },
    ].filter(c => c.visible)

    const pendingQueues = [
        {
            label: 'Seller Applications Pending', count: 4,
            href: '/admin/sellers?tab=pending',
            icon: Store, color: 'text-brand-primary', bg: 'bg-brand-primary/10',
            visible: hasPermission('seller_moderator')
        },
        {
            label: 'Marketplace Ads Pending', count: 7,
            href: '/admin/marketplace?tab=pending',
            icon: Grid, color: 'text-orange-600', bg: 'bg-orange-100',
            visible: hasPermission('marketplace_moderator')
        },
        {
            label: 'Student Verifications Pending', count: 12,
            href: '/admin/verifications?tab=pending',
            icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-100',
            visible: hasPermission('admin')
        },
        {
            label: 'Refund Requests Pending', count: 2,
            href: '/admin/refunds?tab=pending',
            icon: DollarSign, color: 'text-red-600', bg: 'bg-red-100',
            visible: hasPermission('finance_moderator')
        },
    ].filter(q => q.visible)

    const activityTypeColor: Record<string, string> = {
        approve: 'bg-emerald-500',
        reject: 'bg-red-500',
        suspend: 'bg-amber-500',
        change: 'bg-blue-500',
    }

    if (isLoading) {
        return (
            <div className="p-8 animate-pulse space-y-8">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>)}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 space-y-8">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Platform-wide overview and quick actions.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {statCardsData.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            {stat.trend !== undefined && (
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${(stat.trend ?? 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    <TrendingUp className="w-3 h-3" />
                                    {(stat.trend ?? 0) >= 0 ? '+' : ''}{stat.trend}%
                                </div>
                            )}
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900">{stat.value ?? '—'}</p>
                    </div>
                ))}
            </div>

            {/* Pending Queues */}
            {pendingQueues.length > 0 && (
                <div>
                    <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" /> Pending Action Required
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {pendingQueues.map((q, i) => (
                            <Link
                                key={i}
                                href={q.href}
                                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`p-2.5 rounded-xl ${q.bg}`}>
                                        <q.icon className={`w-5 h-5 ${q.color}`} />
                                    </div>
                                    <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                                        {q.count}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 leading-tight">{q.label}</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-1">
                                        Review now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity Log (admin only) */}
            {isAdmin() && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" /> Recent Activity Log
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="py-3 px-5">Admin</th>
                                    <th className="py-3 px-5">Action</th>
                                    <th className="py-3 px-5">Resource</th>
                                    <th className="py-3 px-5 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {activity.map((a, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-5 text-sm font-bold text-gray-900">{a.admin}</td>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${activityTypeColor[a.type] || 'bg-gray-400'}`}></div>
                                                <span className="text-sm text-gray-700 font-medium">{a.action}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 text-sm text-gray-500 font-medium">{a.resource}</td>
                                        <td className="py-3 px-5 text-right text-xs text-gray-400 font-medium whitespace-nowrap">{a.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
