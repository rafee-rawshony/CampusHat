'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'

type Period = '10d' | '1m'

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white shadow-lg border border-gray-100 rounded-lg px-3 py-2 text-sm">
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className="font-bold text-gray-900">৳{Number(payload[0].value).toLocaleString()}</p>
            </div>
        )
    }
    return null
}

export function RevenueChart() {
    const [period, setPeriod] = useState<Period>('10d')

    const { data, isLoading } = useQuery({
        queryKey: ['seller-revenue-chart', period],
        queryFn: () => api.get(`/analytics/seller/revenue/?period=${period}`).then(r => r.data?.data || r.data),
        staleTime: 60_000,
    })

    const chartData = data
        ? (data.labels || []).map((label: string, i: number) => ({
              label,
              value: data.data?.[i] || 0,
          }))
        : []

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="font-semibold text-gray-800">Revenue Overview</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Track your earnings over time</p>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1">
                    {(['10d', '1m'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${
                                period === p
                                    ? 'bg-[#4C3B8A] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {p === '10d' ? '10D' : '1M'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            {isLoading ? (
                <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />
            ) : chartData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
                    No revenue data for this period.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4C3B8A" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#4C3B8A" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#9CA3AF' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#9CA3AF' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `৳${v >= 1000 ? (v / 1000) + 'k' : v}`}
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#4C3B8A"
                            strokeWidth={2}
                            fill="url(#revenueGradient)"
                            dot={{ fill: '#4C3B8A', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#4C3B8A', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}
