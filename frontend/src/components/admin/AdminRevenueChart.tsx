'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminRevenueChart() {
    const [period, setPeriod] = useState<'10d' | '1m'>('10d')

    const { data: chartData, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-revenue-chart', period],
        queryFn: () => api.get(`/admin/analytics/revenue/?period=${period}`).then(r => r.data?.data || r.data),
        // Mock data fallback if endpoint isn't fully ready yet, since we have no mocks here it will error if endpoint missing.
        // Let's rely on error state and retry handling.
    })

    // Map backend data to recharts expected format if they return {labels: [], data: []}
    // Alternatively, if they return [{date, amount}], we map accordingly.
    // The spec states: { labels: string[], data: number[] }
    // e.g. labels: ["Apr 1","Apr 2",...], data: [12000, 15000,...]
    const transformedData = React.useMemo(() => {
        if (!chartData?.labels || !chartData?.data) return []
        return chartData.labels.map((label: string, index: number) => ({
            name: label,
            amount: chartData.data[index] || 0
        }))
    }, [chartData])

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mt-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800 text-base">Revenue Overview</h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setPeriod('10d')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${period === '10d' ? 'bg-[#4C3B8A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        10D
                    </button>
                    <button
                        onClick={() => setPeriod('1m')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${period === '1m' ? 'bg-[#4C3B8A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        1M
                    </button>
                </div>
            </div>

            <div className="h-[250px] w-full mt-2 relative">
                {isLoading ? (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#4C3B8A] animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="absolute inset-0 bg-red-50 rounded-lg flex flex-col items-center justify-center text-red-500 gap-2 border border-red-100">
                        <AlertCircle className="w-8 h-8" />
                        <span className="text-sm font-semibold">Could not load chart data.</span>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 bg-white text-red-600 border-red-200 hover:bg-red-50">
                            Retry
                        </Button>
                    </div>
                ) : transformedData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                        No revenue data available for this period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={transformedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4C3B8A" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#4C3B8A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                                dy={10} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                                tickFormatter={(value) => `৳${value.toLocaleString()}`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                                labelStyle={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#4C3B8A" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorAmount)" 
                                activeDot={{ r: 4, strokeWidth: 0, fill: '#4C3B8A' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
