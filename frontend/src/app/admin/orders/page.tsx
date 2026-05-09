'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_TABS = [
    { id: 'all', label: 'All Orders' },
    { id: 'placed', label: 'Placed' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'packed', label: 'Packed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
]

const STATUS_TRANSITIONS: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
}

function statusColor(s: string) {
    const map: Record<string, string> = {
        placed: 'bg-yellow-50 text-yellow-700',
        confirmed: 'bg-blue-50 text-blue-700',
        packed: 'bg-indigo-50 text-indigo-700',
        shipped: 'bg-purple-50 text-purple-700',
        delivered: 'bg-green-50 text-green-700',
        cancelled: 'bg-red-50 text-red-700',
    }
    return map[s] || 'bg-gray-100 text-gray-600'
}

function fmt(d: string) {
    return d ? format(new Date(d), 'MMM d, yyyy') : '—'
}

export default function AdminOrdersPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('all')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [newStatus, setNewStatus] = useState('')

    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    const { data, isLoading } = useQuery({
        queryKey: ['admin-orders', activeTab, search, page],
        queryFn: () => {
            const params: any = { page, page_size: 20 }
            if (activeTab !== 'all') params.status = activeTab
            if (search) params.search = search
            return api.get('/admin/orders/', { params }).then(r => r.data?.data || r.data)
        },
        staleTime: 30_000,
    })

    const orders = data?.results || data || []
    const totalPages = data?.total_pages || data?.pagination?.total_pages || Math.ceil((data?.count || 0) / 20) || 1

    const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
        mutationFn: ({ id, status, note }: { id: string, status: string, note?: string }) =>
            api.patch(`/admin/orders/${id}/status/`, { status, note }),
        onSuccess: (res) => {
            toast.success('Order status updated')
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
            const updated = res.data?.data
            if (updated) setSelectedOrder(updated)
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to update status')
        },
    })

    const openOrderDetail = async (order: any) => {
        try {
            const res = await api.get(`/admin/orders/${order.id}/`)
            const detail = res.data?.data || res.data
            setSelectedOrder(detail)
            setNewStatus(detail.order_status || detail.status || '')
        } catch {
            setSelectedOrder(order)
            setNewStatus(order.order_status || order.status || '')
        }
    }

    if (!isAdmin()) return null

    return (
        <div className="space-y-5 pb-10">
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
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1) }}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                            activeTab === tab.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-50 text-left">
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Order ID</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Store</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array(8).fill(null).map((_, i) => (
                                <tr key={i}>{Array(7).fill(null).map((_, j) => (
                                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 animate-pulse rounded w-20" /></td>
                                ))}</tr>
                            ))
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />No orders found
                            </td></tr>
                        ) : (
                            orders.map((order: any) => {
                                const s = order.status || order.order_status || ''
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-xs text-brand-primary">#{order.order_number || order.id?.slice(0, 8)}</td>
                                        <td className="px-5 py-3.5 text-gray-700">{order.buyer_name || order.user?.full_name || order.buyer_email || '—'}</td>
                                        <td className="px-5 py-3.5 text-gray-600 text-xs">{order.store_name || '—'}</td>
                                        <td className="px-5 py-3.5 font-semibold text-gray-900">৳{Number(order.total_amount || 0).toLocaleString()}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full capitalize ${statusColor(s)}`}>{s || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-400 text-xs">{fmt(order.created_at)}</td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button size="sm" variant="ghost" className="h-8 px-2 text-gray-500" onClick={() => openOrderDetail(order)}>
                                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {isLoading ? (
                    Array(5).fill(null).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)
                ) : orders.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No orders found</p>
                    </div>
                ) : (
                    orders.map((order: any) => {
                        const s = order.status || order.order_status || ''
                        return (
                            <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4" onClick={() => openOrderDetail(order)}>
                                <div className="flex items-start justify-between mb-2">
                                    <span className="font-mono text-xs text-brand-primary font-medium">#{order.order_number || order.id?.slice(0, 8)}</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${statusColor(s)}`}>{s || '—'}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-800">{order.buyer_name || order.user?.full_name || order.buyer_email || '—'}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm font-bold text-gray-900">৳{Number(order.total_amount || 0).toLocaleString()}</span>
                                    <span className="text-xs text-gray-400">{order.created_at ? format(new Date(order.created_at), 'MMM d') : ''}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 px-3">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Order Detail Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-xl rounded-2xl">
                    <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
                    {selectedOrder && (() => {
                        const s = selectedOrder.status || selectedOrder.order_status || ''
                        const nextStatuses = STATUS_TRANSITIONS[s] || []
                        const addr = selectedOrder.delivery_address_snapshot
                        return (
                            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm text-brand-primary font-bold">#{selectedOrder.order_number || selectedOrder.id?.slice(0, 8)}</span>
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full capitalize ${statusColor(s)}`}>{s}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Customer</span><span className="font-semibold">{selectedOrder.buyer_name || '—'}</span></div>
                                    <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Email</span><span className="font-semibold text-xs break-all">{selectedOrder.buyer_email || '—'}</span></div>
                                    <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Store</span><span className="font-semibold">{selectedOrder.store_name || '—'}</span></div>
                                    <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Payment</span><span className="font-semibold capitalize">{selectedOrder.payment_status || '—'}</span></div>
                                    <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Total</span><span className="font-semibold">৳{Number(selectedOrder.total_amount || 0).toLocaleString()}</span></div>
                                    <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Date</span><span className="font-semibold">{fmt(selectedOrder.created_at)}</span></div>
                                    {addr && <div className="col-span-2 bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Delivery Address</span><span className="font-semibold text-sm">{[addr.address_line1, addr.city, addr.district].filter(Boolean).join(', ')}</span></div>}
                                    {selectedOrder.tracking_code && <div className="col-span-2 bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Tracking</span><span className="font-semibold font-mono">{selectedOrder.tracking_code}</span></div>}
                                </div>
                                {selectedOrder.items?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Items</p>
                                        <div className="space-y-2">
                                            {selectedOrder.items.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                                    <span className="font-medium text-gray-800 truncate max-w-[200px]">{item.product_name || item.name}</span>
                                                    <span className="text-gray-500 ml-2 shrink-0">x{item.quantity} · ৳{Number(item.unit_price || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {nextStatuses.length > 0 && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                                        <div className="flex gap-2">
                                            <Select value={newStatus} onValueChange={setNewStatus}>
                                                <SelectTrigger className="flex-1 bg-gray-50"><SelectValue placeholder="Select new status" /></SelectTrigger>
                                                <SelectContent>
                                                    {nextStatuses.map(st => (
                                                        <SelectItem key={st} value={st} className="capitalize">{st}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white"
                                                disabled={!newStatus || newStatus === s || updatingStatus}
                                                onClick={() => updateStatus({ id: selectedOrder.id, status: newStatus })}
                                            >
                                                {updatingStatus ? 'Updating...' : 'Update'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
