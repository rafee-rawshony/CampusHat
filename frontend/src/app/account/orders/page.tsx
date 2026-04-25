'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, ChevronRight, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { listMyOrders } from '@/services/orders.service'
import { OrderStatusBadge } from '@/components/seller/OrderStatusBadge'

interface OrderItem {
    id: string
    product_name: string
    quantity: number
    unit_price: string
}

interface Order {
    id: string
    order_number: string
    status: string
    total_amount: string
    created_at: string
    items: OrderItem[]
}

export default function MyOrdersPage() {
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['my-orders', page],
        queryFn: () => listMyOrders({ ordering: '-created_at', page }),
        staleTime: 30_000,
    })

    const orders: Order[] = data?.data?.results || data?.results || data || []
    const totalPages = data?.data?.pagination?.total_pages || data?.pagination?.total_pages || 1

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Orders</h2>

            {/* Loading skeleton */}
            {isLoading && (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingBag className="w-14 h-14 text-gray-200 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800">No orders yet</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-6">Start shopping to see your orders here.</p>
                    <Link
                        href="/shop"
                        className="px-6 py-2.5 bg-[#4C3B8A] text-white text-sm font-semibold rounded-xl hover:bg-[#3d2e6e] transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            )}

            {/* Desktop table */}
            {!isLoading && orders.length > 0 && (
                <>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                                    <th className="pb-3 font-medium">Order #</th>
                                    <th className="pb-3 font-medium">Items</th>
                                    <th className="pb-3 font-medium">Total</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 font-mono font-medium text-gray-900">
                                            #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="py-4 text-gray-600">
                                            {order.items?.[0]?.product_name || '—'}
                                            {order.items?.length > 1 && (
                                                <span className="text-gray-400 ml-1">+{order.items.length - 1} more</span>
                                            )}
                                        </td>
                                        <td className="py-4 font-semibold text-gray-900">
                                            ৳{parseFloat(order.total_amount).toLocaleString()}
                                        </td>
                                        <td className="py-4">
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                        <td className="py-4 text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="py-4 text-right">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="inline-flex items-center gap-1 text-[#4C3B8A] text-xs font-semibold hover:underline"
                                            >
                                                Details <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {orders.map(order => (
                            <Link
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:border-[#4C3B8A]/30 transition-colors bg-gray-50"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-gray-900">
                                            #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                                        </span>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                    <p className="text-sm text-gray-600 truncate max-w-[220px]">
                                        {order.items?.[0]?.product_name || '—'}
                                        {order.items?.length > 1 && ` +${order.items.length - 1}`}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className="font-bold text-gray-900 text-sm">
                                        ৳{parseFloat(order.total_amount).toLocaleString()}
                                    </span>
                                    <Package className="w-4 h-4 text-gray-300" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                ← Prev
                            </button>
                            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
