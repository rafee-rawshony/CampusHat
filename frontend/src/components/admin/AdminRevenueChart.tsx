'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminRevenueChart() {
    const [period, setPeriod] = useState<'10d' | '1m'>('10d')

    const { data: chartData, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-revenue-chart', period],
        queryFn: () => api.get(`/admin/analytics/revenue/?period=${period}`).then(r => r.data?.data || r.data),
    })

    // Transform backend { labels, data } into recharts format
    const transformedData = useMemo(() => {
        if (!chartData?.labels || !chartData?.data) return []
        return chartData.labels.map((label: string, index: number) => ({
            name: label,
            amount: chartData.data[index] || 0,
        }))
    }, [chartData])

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            {/* Header with period toggle */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 text-sm">Revenue Overview</h2>
                        <p className="text-[11px] text-gray-400">Platform earnings over time</p>
                    </div>
                </div>
                {/* Period toggle */}
                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                    {(['10d', '1m'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                period === p
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {p === '10d' ? '10 Days' : '1 Month'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart area */}
            <div className="h-[260px] w-full relative">
                {isLoading ? (
                    <div className="absolute inset-0 bg-gray-50 animate-pulse rounded-xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="absolute inset-0 bg-red-50 rounded-xl flex flex-col items-center justify-center text-red-500 gap-2 border border-red-100">
                        <AlertCircle className="w-7 h-7" />
                        <span className="text-sm font-medium">Could not load chart data</span>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-1 text-xs">
                            Retry
                        </Button>
                    </div>
                ) : transformedData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl">
                        No revenue data available for this period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={transformedData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4C3B8A" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#4C3B8A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                dy={8}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '10px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    padding: '8px 12px',
                                }}
                                formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                                labelStyle={{ color: '#6b7280', fontWeight: 600, marginBottom: '2px', fontSize: '12px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#4C3B8A"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#adminRevenueGradient)"
                                activeDot={{ r: 5, strokeWidth: 2, stroke: '#4C3B8A', fill: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
