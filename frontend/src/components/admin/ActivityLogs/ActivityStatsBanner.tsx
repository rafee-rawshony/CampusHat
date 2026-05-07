'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle, XCircle, Shield } from 'lucide-react'
import { api } from '@/lib/api'

export function ActivityStatsBanner() {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['admin-activity-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/action-logs/stats/')
            return res.data?.data || res.data || {}
        },
        staleTime: 60_000,
        retry: false, // Don't retry if endpoint fails, just hide or show defaults
    })

    if (isError) return null

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
                            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Default to 0 if API is completely unavailable
    const s = stats || {}
    const displayStats = [
        {
            label: 'Total Actions Today',
            value: s.actions_today ?? 0,
            icon: <Activity className="w-5 h-5 text-[#4C3B8A]" />,
            bg: 'bg-[#4C3B8A]/10'
        },
        {
            label: 'Approvals Today',
            value: s.approvals_today ?? 0,
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            bg: 'bg-green-100'
        },
        {
            label: 'Rejections Today',
            value: s.rejections_today ?? 0,
            icon: <XCircle className="w-5 h-5 text-red-500" />,
            bg: 'bg-red-100'
        },
        {
            label: 'Active Admins',
            value: s.active_admins_today ?? 0,
            icon: <Shield className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-100'
        }
    ]

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayStats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                        {stat.icon}
                    </div>
                    <div>
                        <div className="font-bold text-xl text-gray-900 leading-none">
                            {stat.value}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-medium">
                            {stat.label}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
