'use client'

import { useQuery } from '@tanstack/react-query'
import {
    Users, Loader2, Repeat2, UserCheck, DollarSign,
    GraduationCap, TrendingUp, Crown,
} from 'lucide-react'

import { api } from '@/lib/api'

interface CustomerData {
    total_customers: number
    repeat_buyers: number
    one_time_buyers: number
    repeat_rate: number
    average_order_value: string
    top_customers: {
        buyer__id: string
        buyer__email: string
        buyer__first_name: string
        buyer__last_name: string
        total_spent: string
        order_count: number
    }[]
    university_distribution: {
        buyer__university__name: string | null
        count: number
    }[]
    monthly_trend: {
        month: string
        customers: number
        orders: number
        revenue: string
    }[]
}

function StatCard({ icon: Icon, iconBg, label, value, sub }: {
    icon: React.ElementType
    iconBg: string
    label: string
    value: string | number
    sub?: string
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
                {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    )
}

export default function CustomerInsightsPage() {
    const { data, isLoading } = useQuery<CustomerData>({
        queryKey: ['seller-customer-insights'],
        queryFn: () =>
            api.get('/analytics/seller/customers/').then(r => r.data?.data),
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[#4C3B8A]" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No customer data available yet</p>
                <p className="text-xs text-gray-400 mt-1">Start selling to see insights here</p>
            </div>
        )
    }

    const maxUniCount = Math.max(...(data.university_distribution || []).map(u => u.count), 1)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#4C3B8A]" />
                    Customer Insights
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Understand your buyers — demographics, retention, and lifetime value
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    icon={Users}
                    iconBg="bg-blue-50 text-blue-600"
                    label="Total Customers"
                    value={data.total_customers}
                />
                <StatCard
                    icon={Repeat2}
                    iconBg="bg-emerald-50 text-emerald-600"
                    label="Repeat Buyers"
                    value={data.repeat_buyers}
                    sub={`${data.repeat_rate}% repeat rate`}
                />
                <StatCard
                    icon={UserCheck}
                    iconBg="bg-amber-50 text-amber-600"
                    label="One-Time Buyers"
                    value={data.one_time_buyers}
                />
                <StatCard
                    icon={DollarSign}
                    iconBg="bg-purple-50 text-purple-600"
                    label="Avg Order Value"
                    value={`৳${parseFloat(data.average_order_value).toLocaleString()}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Customers */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <h2 className="font-semibold text-gray-900 text-sm">Top Customers by LTV</h2>
                    </div>
                    {data.top_customers.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">No data yet</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {data.top_customers.map((customer, idx) => (
                                <div key={customer.buyer__id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                        idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {customer.buyer__first_name || customer.buyer__email?.split('@')[0] || 'Anonymous'}
                                            {customer.buyer__last_name ? ` ${customer.buyer__last_name}` : ''}
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            {customer.order_count} order{customer.order_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">
                                        ৳{parseFloat(customer.total_spent).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* University Distribution */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        <h2 className="font-semibold text-gray-900 text-sm">Campus Distribution</h2>
                    </div>
                    {(data.university_distribution || []).length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">No data yet</div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {data.university_distribution.map((uni) => (
                                <div key={uni.buyer__university__name || 'unknown'}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">
                                            {uni.buyer__university__name || 'Unknown'}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500">
                                            {uni.count} buyer{uni.count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                                            style={{ width: `${(uni.count / maxUniCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Trend */}
            {(data.monthly_trend || []).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <h2 className="font-semibold text-gray-900 text-sm">Monthly Customer Trend</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Month</th>
                                    <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Customers</th>
                                    <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Orders</th>
                                    <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.monthly_trend.map((row) => (
                                    <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50/30">
                                        <td className="py-2.5 px-4 font-medium text-gray-800">{row.month}</td>
                                        <td className="py-2.5 px-4 text-right text-gray-600">{row.customers}</td>
                                        <td className="py-2.5 px-4 text-right text-gray-600">{row.orders}</td>
                                        <td className="py-2.5 px-4 text-right font-medium text-gray-700">
                                            ৳{parseFloat(row.revenue || '0').toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Retention tip */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">💡 Retention Tip</h3>
                <p className="text-xs text-blue-600">
                    {data.repeat_rate >= 30
                        ? 'Great retention! Your repeat rate is strong. Keep engaging loyal customers with exclusive deals and early access.'
                        : 'Your repeat rate is below 30%. Consider sending follow-up messages, offering loyalty discounts, or creating bundles to encourage repeat purchases.'
                    }
                </p>
            </div>
        </div>
    )
}
