'use client'

import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/formatDate'
import { OrderStatusBadge } from '@/components/seller/OrderStatusBadge'
import { ShipOrderModal } from '@/components/seller/orders/ShipOrderModal'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { normalizeListResponse } from '@/lib/response'

interface SellerOrderTableProps {
    orders: any[]
    isLoading: boolean
}

export function SellerOrderTable({ orders, isLoading }: SellerOrderTableProps) {
    const queryClient = useQueryClient()
    const [shipTarget, setShipTarget] = useState<any>(null)
    const safeOrders = normalizeListResponse<any>(orders)

    const actionMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: string }) =>
            api.post(`/seller/orders/${id}/${action}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
            queryClient.invalidateQueries({ queryKey: ['seller-stats'] })
            toast.success('Order updated!')
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || 'Action failed')
        },
    })

    const ActionButton = ({ order }: { order: any }) => {
        const isActing = actionMutation.isPending

        switch (order.status) {
            case 'placed':
                return (
                    <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 h-8 rounded-lg gap-1.5"
                        onClick={() => actionMutation.mutate({ id: order.id, action: 'confirm' })}
                        disabled={isActing}
                    >
                        {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Confirm
                    </Button>
                )
            case 'confirmed':
                return (
                    <Button
                        size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-3 h-8 rounded-lg"
                        onClick={() => actionMutation.mutate({ id: order.id, action: 'pack' })}
                        disabled={isActing}
                    >
                        Mark Packed
                    </Button>
                )
            case 'packed':
                return (
                    <Button
                        size="sm"
                        className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white text-xs px-3 h-8 rounded-lg"
                        onClick={() => setShipTarget(order)}
                    >
                        Ship Order
                    </Button>
                )
            case 'shipped':
                return (
                    <span className="text-[#4C3B8A] text-xs font-semibold cursor-pointer hover:underline">
                        View Tracking
                    </span>
                )
            case 'delivered':
                return (
                    <Link href={`/seller/orders/${order.id}`} className="text-gray-500 text-xs font-medium hover:underline">
                        View Details
                    </Link>
                )
            case 'cancelled':
                return (
                    <Link href={`/seller/orders/${order.id}`} className="text-gray-400 text-xs hover:underline">
                        Details
                    </Link>
                )
            default:
                return null
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-1/6"></div>
                        <div className="h-4 bg-gray-100 rounded flex-1"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/8"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (safeOrders.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-sm">No orders found for this filter.</p>
            </div>
        )
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hidden md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                            {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {safeOrders.map((order: any) => {
                            const firstItem = order.items?.[0]
                            const moreCount = (order.items?.length || 1) - 1
                            return (
                                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-sm text-gray-700">#{order.order_number}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {order.buyer?.profile_picture ? (
                                                <img src={order.buyer.profile_picture} className="w-6 h-6 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-[#4C3B8A]/10 text-[#4C3B8A] text-[10px] font-bold flex items-center justify-center">
                                                    {order.buyer?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <span className="text-sm text-gray-700">{order.buyer?.full_name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-600 line-clamp-1">{firstItem?.product_name || '—'}</p>
                                        {moreCount > 0 && <p className="text-xs text-gray-400">+{moreCount} more</p>}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">৳{Number(order.total_amount).toLocaleString()}</td>
                                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{order.created_at ? formatDate(order.created_at) : '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <ActionButton order={order} />
                                            <Link href={`/seller/orders/${order.id}`}>
                                                <Button size="icon" variant="outline" className="w-7 h-7 rounded-lg border-gray-200">
                                                    <Eye className="w-3 h-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card list */}
            <div className="md:hidden space-y-3">
                {safeOrders.map((order: any) => (
                    <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm font-semibold text-gray-800">#{order.order_number}</span>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-600">{order.buyer?.full_name || 'Unknown'}</p>
                        <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-gray-900">৳{Number(order.total_amount).toLocaleString()}</span>
                            <ActionButton order={order} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Ship Modal */}
            <ShipOrderModal
                order={shipTarget}
                open={!!shipTarget}
                onClose={() => setShipTarget(null)}
            />
        </>
    )
}
