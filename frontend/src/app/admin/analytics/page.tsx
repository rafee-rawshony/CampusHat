'use client'

import React, { useState, useEffect } from 'react'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

type TimeRange = '7D' | '30D' | '90D' | 'All Time'

export default function AdminAnalyticsPage() {
    const [revenueRange, setRevenueRange] = useState<TimeRange>('30D')
    const [isLoading, setIsLoading] = useState(true)
    const [revenueData, setRevenueData] = useState<any[]>([])
    const [userGrowthData, setUserGrowthData] = useState<any[]>([])
    const [topUniversities, setTopUniversities] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [unfulfilledSearches, setUnfulfilledSearches] = useState<any[]>([])

    useEffect(() => {
        // API: GET /api/v1/admin/analytics/?range=30D
        const buildRevData = (days: number) =>
            Array.from({ length: days > 14 ? 12 : days }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (days - i))
                return {
                    date: date.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
                    mall: Math.floor(Math.random() * 80000) + 20000,
                    marketplace: Math.floor(Math.random() * 15000) + 3000,
                }
            })

        setTimeout(() => {
            setRevenueData(buildRevData(30))
            setUserGrowthData(
                Array.from({ length: 10 }, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - (9 - i))
                    return {
                        date: d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
                        normal_user: Math.floor(Math.random() * 80) + 10,
                        student: Math.floor(Math.random() * 50) + 5,
                        seller: Math.floor(Math.random() * 20) + 2,
                    }
                })
            )
            setTopUniversities([
                { name: 'University of Dhaka', users: 4120, sellers: 82, ads: 312, revenue: 420000 },
                { name: 'BUET', users: 2840, sellers: 45, ads: 198, revenue: 354000 },
                { name: 'NSU', users: 1950, sellers: 63, ads: 274, revenue: 228000 },
                { name: 'DIU', users: 1430, sellers: 38, ads: 165, revenue: 183000 },
                { name: 'BRAC University', users: 1210, sellers: 29, ads: 140, revenue: 152000 },
            ])
            setTopProducts([
                { name: 'Sony WH-1000XM4', store: 'TechHub Store', sold: 47, revenue: 4935000 },
                { name: 'Campus Backpack Pro', store: 'Student Essentials', sold: 132, revenue: 1188000 },
                { name: 'Calculus 8th Edition', store: 'BookWorld BD', sold: 215, revenue: 344000 },
                { name: 'Mechanical Keyboard', store: 'TechHub Store', sold: 29, revenue: 1218000 },
                { name: 'University Hoodie', store: 'Campus Apparel BD', sold: 188, revenue: 1316000 },
            ])
            setUnfulfilledSearches([
                { query: 'Second hand laptop core i7 8th gen', count: 234, date: '2024-06-25' },
                { query: 'Calculus 9th edition Thomas', count: 187, date: '2024-06-24' },
                { query: 'Affordable lab coat medical', count: 143, date: '2024-06-24' },
                { query: 'Graphics tablet cheap bangladesh', count: 98, date: '2024-06-23' },
                { query: 'Study table dorm room', count: 87, date: '2024-06-22' },
            ])
            setIsLoading(false)
        }, 800)
    }, [])

    useEffect(() => {
        // Rebuild on range change
        const days = revenueRange === '7D' ? 7 : revenueRange === '30D' ? 30 : revenueRange === '90D' ? 90 : 180
        const data = Array.from({ length: days > 14 ? 12 : days }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (days - i))
            return {
                date: d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
                mall: Math.floor(Math.random() * 80000) + 20000,
                marketplace: Math.floor(Math.random() * 15000) + 3000,
            }
        })
        setRevenueData(data)
    }, [revenueRange])

    const ranges: TimeRange[] = ['7D', '30D', '90D', 'All Time']

    const sectionHeader = (title: string, subtitle?: string) => (
        <div className="mb-5">
            <h2 className="text-lg font-black text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
    )

    if (isLoading) {
        return <div className="p-8 animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
    }

    return (
        <div className="p-6 lg:p-8 space-y-10">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Platform Analytics</h1>
                <p className="text-gray-500 text-sm mt-1">Revenue trends, user growth, and product performance insights.</p>
            </div>

            {/* Section 1: Revenue Overview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Revenue Overview</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Daily mall vs marketplace earnings</p>
                    </div>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        {ranges.map(r => (
                            <button
                                key={r}
                                onClick={() => setRevenueRange(r)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all
                                    ${revenueRange === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenueData}>
                        <defs>
                            <linearGradient id="mallGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`৳${(value as number).toLocaleString()}`]} />
                        <Legend />
                        <Area type="monotone" dataKey="mall" name="Mall Revenue" stroke="#7C3AED" fill="url(#mallGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="marketplace" name="Marketplace" stroke="#059669" fill="url(#mktGrad)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Section 2: User Growth */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                {sectionHeader('User Growth', 'New registrations per day by role')}
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="normal_user" name="Normal User" fill="#E0E7FF" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="student" name="Student" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="seller" name="Seller" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Section 3 & 4: Tables Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Universities */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                        {sectionHeader('Top Universities', 'By user count and revenue')}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="py-3 px-4">University</th>
                                    <th className="py-3 px-4 text-right">Users</th>
                                    <th className="py-3 px-4 text-right">Sellers</th>
                                    <th className="py-3 px-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topUniversities.map((u, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-4 font-bold text-gray-900 text-xs">{u.name}</td>
                                        <td className="py-3 px-4 text-right text-xs font-medium text-gray-600">{u.users.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-xs font-medium text-gray-600">{u.sellers}</td>
                                        <td className="py-3 px-4 text-right text-xs font-bold text-gray-900">৳{(u.revenue / 1000).toFixed(0)}k</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                        {sectionHeader('Top Mall Products', 'By units sold')}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="py-3 px-4">Product</th>
                                    <th className="py-3 px-4 text-right">Sold</th>
                                    <th className="py-3 px-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topProducts.map((p, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-gray-900 text-xs">{p.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{p.store}</p>
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs font-bold text-gray-700">{p.sold}</td>
                                        <td className="py-3 px-4 text-right text-xs font-bold text-gray-900">৳{(p.revenue / 1000).toFixed(0)}k</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Section 5: Unfulfilled Searches */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-amber-50/50">
                    <h2 className="text-lg font-black text-gray-900">Unfulfilled Search Queries</h2>
                    <p className="text-sm text-amber-700 mt-0.5 font-medium">
                        Searches with zero results — potential product demand opportunities for your sellers.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <th className="py-3 px-5">Search Query</th>
                                <th className="py-3 px-5 text-right">Searches</th>
                                <th className="py-3 px-5 text-right">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {unfulfilledSearches.map((s, i) => (
                                <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="py-3.5 px-5 font-bold text-gray-900 italic">&ldquo;{s.query}&rdquo;</td>
                                    <td className="py-3.5 px-5 text-right">
                                        <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full">{s.count}</span>
                                    </td>
                                    <td className="py-3.5 px-5 text-right text-xs font-medium text-gray-400">{s.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
