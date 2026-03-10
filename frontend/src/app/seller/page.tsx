'use client'

import React, { useState, useEffect } from 'react'
import {
    DollarSign, ShoppingBag, Star, TrendingUp, TrendingDown, ArrowRight, Store
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getInitials } from '@/lib/utils'

export default function SellerOverviewPage() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [chartPeriod, setChartPeriod] = useState<'10D' | '1M'>('10D')

    useEffect(() => {
        // Mock API Call: GET /api/v1/seller/analytics/revenue/?period={chartPeriod}
        // Mock API Call: GET /api/v1/seller/orders/?limit=5&sort=recent
        setIsLoading(true)
        setTimeout(() => {
            const revenueData = chartPeriod === '10D'
                ? [
                    { name: '10 D AGO', value: 4000 },
                    { name: '8 D AGO', value: 3000 },
                    { name: '6 D AGO', value: 5000 },
                    { name: '4 D AGO', value: 8780 },
                    { name: '2 D AGO', value: 10900 },
                    { name: 'YESTERDAY', value: 9000 },
                    { name: 'TODAY', value: 12500 }
                ]
                : [
                    { name: '1 M AGO', value: 24000 },
                    { name: '3 W AGO', value: 33000 },
                    { name: '2 W AGO', value: 45000 },
                    { name: '1 W AGO', value: 28780 },
                    { name: 'TODAY', value: 50900 },
                ]

            setStats({
                total_revenue: 125400,
                revenue_trend: 14.5, // positive percentage
                orders_total: 1, // Phase S5 spec
                orders_pending: 0,
                products_live: 5, // Phase S5 spec
                products_status: 'All stores active',
                rating_average: 4.9,
                rating_count: 528,
                revenue_data: revenueData,
                recent_orders: [
                    { id: 'ORD-002', buyer: 'Bob Williams', amount: 125000, status: 'shipped', date: '2024-05-21', avatar: null },
                    { id: 'ORD-001', buyer: 'Alice Johnson', amount: 450, status: 'delivered', date: '2024-05-20', avatar: 'https://placehold.co/40x40/blue/white' },
                ]
            })
            setIsLoading(false)
        }, 600)
    }, [chartPeriod])

    if (isLoading || !stats) {
        return <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
    }

    const statCards = [
        {
            title: 'TOTAL REVENUE', value: `৳${stats.total_revenue.toLocaleString()}`,
            trend: stats.revenue_trend, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100',
            sub: 'vs last week'
        },
        {
            title: 'TOTAL ORDERS', value: stats.orders_total,
            icon: ShoppingBag, color: 'text-teal-600', bg: 'bg-teal-100',
            sub: `${stats.orders_pending} awaiting processing`
        },
        {
            title: 'LIVE PRODUCTS', value: stats.products_live,
            icon: Store, color: 'text-blue-600', bg: 'bg-blue-100',
            sub: stats.products_status
        },
        {
            title: 'STORE RATING', value: stats.rating_average,
            icon: Star, color: 'text-amber-500', bg: 'bg-amber-100',
            sub: `${stats.rating_count} total reviews`
        }
    ]

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            {stat.trend !== undefined && (
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {stat.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                                </div>
                            )}
                        </div>
                        <h3 className="text-gray-400 text-[10px] font-black tracking-wider mb-0.5">{stat.title}</h3>
                        <p className="text-2xl font-black text-gray-900 leading-none mb-1.5">{stat.value}</p>
                        <p className="text-[11px] font-medium text-gray-500">{stat.sub}</p>

                        <button className="absolute inset-x-0 bottom-0 bg-gray-50/80 border-t border-gray-100 py-1.5 text-center text-[10px] font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-sm">
                            INSIGHT <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Analytics */}
                <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-lg font-black text-gray-900">Revenue Analytics</h2>
                            <p className="text-sm text-gray-500 font-medium">Daily earnings performance over the last {chartPeriod === '10D' ? '10 days' : 'month'}</p>
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                            {['10D', '1M'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setChartPeriod(period as any)}
                                    className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === period ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenue_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#634C9F" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#634C9F" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(value) => `৳${value.toLocaleString()}`} dx={-10} width={80} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    formatter={(value: any) => [`৳${value.toLocaleString()}`, 'Revenue']}
                                    labelStyle={{ fontWeight: 'black', color: '#0f172a', marginBottom: '4px' }}
                                    itemStyle={{ fontWeight: 'bold', color: '#634C9F' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#634C9F" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: '#634C9F' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Campus Orders */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                        <h2 className="text-base font-black text-gray-900">Recent Campus Orders</h2>
                        <Link href="/seller/orders" className="text-brand-primary text-xs font-bold hover:underline flex items-center">
                            View All <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                    <th className="py-3 px-4 font-black">Order ID</th>
                                    <th className="py-3 px-4 font-black">Student</th>
                                    <th className="py-3 px-4 font-black text-right">Amount</th>
                                    <th className="py-3 px-4 font-black text-right">Status</th>
                                    <th className="py-3 px-4 font-black text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recent_orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-3 px-4">
                                            <span className="text-xs font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{order.id}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6 border border-gray-200">
                                                    {order.avatar ? <AvatarImage src={order.avatar} /> : <AvatarFallback className="text-[9px] font-bold">{getInitials(order.buyer)}</AvatarFallback>}
                                                </Avatar>
                                                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{order.buyer}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-[13px] font-black text-gray-900">৳{order.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shadow-sm uppercase tracking-wider
                                                ${order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                ${order.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                ${order.status === 'shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                                ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                            `}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{order.date}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {stats.recent_orders.length === 0 && (
                            <div className="p-8 text-center text-sm text-gray-500 font-medium">
                                No recent orders found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
