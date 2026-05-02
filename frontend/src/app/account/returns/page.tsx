'use client'

/**
 * My Returns.
 *
 * Lists orders that have been refunded (full or partial). For now we
 * use the order's payment_status to filter — once the refunds app
 * exposes a per-item return-request endpoint we can switch to that.
 */

import Link from 'next/link'
import { Package, RotateCcw, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { listMyOrders } from '@/services/orders.service'
import { Button } from '@/components/ui/button'

interface OrderItemPreview {
    product_name: string
    quantity: number
    image_url: string | null
}

interface Order {
    id: string
    order_number: string
    store_name: string
    total_amount: string
    payment_status: string
    item_count: number
    items_preview: OrderItemPreview[]
    created_at: string
}

export default function ReturnsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['my-returns'],
        queryFn: () => listMyOrders({ ordering: '-created_at', status: 'refunded' }),
        staleTime: 30_000,
    })

    const orders: Order[] = data?.data?.results || data?.results || data?.data || data || []

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 md:px-8 py-5">
                <h1 className="text-xl font-bold text-gray-900">My Returns</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Track items you&apos;ve returned and their refund status.
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && orders.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RotateCcw className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No returns yet</h3>
                    <p className="text-sm text-gray-500 mb-5">
                        Returned items and their refund status will appear here.
                    </p>
                    <Link href="/account/orders">
                        <Button variant="outline">Back to My Orders</Button>
                    </Link>
                </div>
            )}

            {/* Returned orders */}
            {!isLoading && orders.length > 0 && (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const isFullRefund = order.payment_status === 'refunded'
                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="font-semibold text-gray-700 truncate max-w-[180px] sm:max-w-none">
                                            {order.store_name || 'Store'}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-gray-500 text-xs">
                                            Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded ${
                                        isFullRefund ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {isFullRefund ? 'Refunded' : 'Partially Refunded'}
                                    </span>
                                </div>

                                <div className="p-5 space-y-3">
                                    {(order.items_preview || []).slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                                                {item.image_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
                                    <Link href={`/orders/${order.id}`} className="text-xs font-bold uppercase tracking-wide text-brand-primary hover:underline">
                                        View Details
                                    </Link>
                                    <span className="text-base font-bold text-gray-900">
                                        ৳{parseFloat(order.total_amount).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
