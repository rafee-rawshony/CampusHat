'use client'

import React, { useState, useEffect } from 'react'
import {
    DollarSign, ShoppingBag, Package, Star, TrendingUp, TrendingDown, Clock, ArrowRight, Wallet
} from 'lucide-react'

import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function SellerDashboardPage() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [chartPeriod, setChartPeriod] = useState<'7D' | '30D' | '90D'>('30D')

    useEffect(() => {
        // Mock API Call
        setTimeout(() => {
            setStats({
                total_revenue: 125400,
                revenue_trend: 14.5, // positive percentage
                orders_today: 12,
                orders_trend: -2.4,
                total_products: 45,
                products_trend: 5.0,
                rating_average: 4.8,
                rating_trend: 0.1,
                pending_orders: 3,
                pending_payouts: 1,
                revenue_data: [
                    { name: '1', value: 4000 },
                    { name: '5', value: 3000 },
                    { name: '10', value: 5000 },
                    { name: '15', value: 8780 },
                    { name: '20', value: 10900 },
                    { name: '25', value: 9000 },
                    { name: '30', value: 12500 }
                ],
                recent_orders: [
                    { id: 'ORD-123', buyer: 'Rahim Uddin', amount: 4500, status: 'pending', date: '2 hours ago' },
                    { id: 'ORD-124', buyer: 'Sadia Rahman', amount: 1200, status: 'confirmed', date: '5 hours ago' },
                    { id: 'ORD-125', buyer: 'Karim Hasan', amount: 8900, status: 'shipped', date: '1 day ago' }
                ],
                top_products: [
                    { id: 'p1', name: 'Calculus 8th Edition', sold: 24, revenue: 36000, image: 'https://placehold.co/100x100/purple/white' },
                    { id: 'p2', name: 'Sony WH-1000XM4', sold: 5, revenue: 105000, image: 'https://placehold.co/100x100/orange/white' }
                ]
            })
            setIsLoading(false)
        }, 800)
    }, [chartPeriod])

    if (isLoading || !stats) {
        return <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
    }

    const statCards = [
        {
            title: 'Total Revenue', value: `৳${stats.total_revenue.toLocaleString()}`,
            trend: stats.revenue_trend, icon: DollarSign, color: 'text-brand-primary', bg: 'bg-brand-primary/10'
        },
        {
            title: 'Orders Today', value: stats.orders_today,
            trend: stats.orders_trend, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100'
        },
        {
            title: 'Products', value: stats.total_products,
            trend: stats.products_trend, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-100'
        },
        {
            title: 'Average Rating', value: stats.rating_average,
            trend: stats.rating_trend, icon: Star, color: 'text-orange-600', bg: 'bg-orange-100'
        }
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Welcome back, {(user as any)?.store_name || 'Seller'}!</h1>
                    <p className="text-gray-500 text-sm mt-1">Here is what is happening with your store today.</p>
                </div>

                {/* Alerts Box */}
                {(stats.pending_orders > 0 || stats.pending_payouts > 0) && (
                    <div className="flex gap-3">
                        {stats.pending_orders > 0 && (
                            <Link href="/seller/orders" className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-bold">{stats.pending_orders} orders waiting</span>
                            </Link>
                        )}
                        {stats.pending_payouts > 0 && (
                            <Link href="/seller/wallet" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                                <Wallet className="w-4 h-4" />
                                <span className="text-sm font-bold">{stats.pending_payouts} payout pending</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {stat.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {Math.abs(stat.trend)}%
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-bold mb-1">{stat.title}</h3>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-gray-900">Revenue Overview</h2>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['7D', '30D', '90D'].map(period => (
                            <button
                                key={period}
                                onClick={() => setChartPeriod(period as any)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${chartPeriod === period ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.revenue_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#634C9F" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#634C9F" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `৳${value}`} dx={-10} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`৳${value}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#634C9F" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
                        <Link href="/seller/orders" className="text-brand-primary text-sm font-bold hover:underline flex items-center">
                            View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1">
                        {stats.recent_orders.map((order: any) => (
                            <div key={order.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{order.id}</p>
                                    <p className="text-xs text-gray-500 mt-1">{order.buyer} • {order.date}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="font-black text-gray-900">৳{order.amount}</p>
                                    </div>
                                    <Badge variant="outline" className={`
                                        ${order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                        ${order.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                        ${order.status === 'shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                    `}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-black text-gray-900">Top Products</h2>
                        <Link href="/seller/products" className="text-brand-primary text-sm font-bold hover:underline flex items-center">
                            Manage Inventory <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1">
                        {stats.top_products.map((product: any) => (
                            <div key={product.id} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <Image src={product.image} alt={product.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{product.sold} sold this month</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-emerald-600">৳{product.revenue.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Revenue</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
