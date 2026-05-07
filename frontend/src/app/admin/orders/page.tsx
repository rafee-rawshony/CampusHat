'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

const STATUS_TABS = [
    { id: 'all', label: 'All Orders' },
    { id: 'placed', label: 'Placed' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
]

// Status badge color map
function statusColor(status: string) {
    const map: Record<string, string> = {
        placed: 'bg-yellow-50 text-yellow-700',
        confirmed: 'bg-blue-50 text-blue-700',
        packed: 'bg-indigo-50 text-indigo-700',
        shipped: 'bg-purple-50 text-purple-700',
        delivered: 'bg-green-50 text-green-700',
        cancelled: 'bg-red-50 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
}

export default function AdminOrdersPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('all')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    // Fetch orders from backend
    const { data, isLoading } = useQuery({
        queryKey: ['admin-orders', activeTab, search, page],
        queryFn: () => {
            const params: any = { page, page_size: 20, ordering: '-created_at' }
            if (activeTab !== 'all') params.status = activeTab
            if (search) params.search = search
            return api.get('/admin/orders/', { params }).then(r => r.data?.data || r.data)
        },
        staleTime: 30_000,
    })

    const orders = data?.results || data || []
    const totalPages = data?.pagination?.total_pages || Math.ceil((data?.count || 0) / 20) || 1

    if (!isAdmin()) return null

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Monitor and manage all platform orders</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search orders..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        className="pl-9 text-sm"
                    />
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-100">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setPage(1) }}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                            activeTab === tab.id
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders Table — desktop */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-50 text-left">
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Order ID</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array(8).fill(null).map((_, i) => (
                                <tr key={i}>
                                    {Array(5).fill(null).map((_, j) => (
                                        <td key={j} className="px-5 py-4">
                                            <div className="h-4 bg-gray-100 animate-pulse rounded w-20" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    No orders found
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5 font-mono text-xs text-brand-primary">
                                        #{order.order_number || order.id?.slice(0, 8)}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-700">
                                        {order.user?.full_name || order.buyer_name || '—'}
                                    </td>
                                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                                        ৳{Number(order.total_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full ${statusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                                        {order.created_at ? format(new Date(order.created_at), 'MMM d, yyyy') : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Orders Cards — mobile */}
            <div className="md:hidden space-y-3">
                {isLoading ? (
                    Array(5).fill(null).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
                    ))
                ) : orders.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No orders found</p>
                    </div>
                ) : (
                    orders.map((order: any) => (
                        <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                                <span className="font-mono text-xs text-brand-primary font-medium">
                                    #{order.order_number || order.id?.slice(0, 8)}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                                {order.user?.full_name || order.buyer_name || '—'}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-bold text-gray-900">
                                    ৳{Number(order.total_amount || 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {order.created_at ? format(new Date(order.created_at), 'MMM d') : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 px-3">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
