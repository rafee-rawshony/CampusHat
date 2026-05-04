'use client'

/**
 * My Orders (Daraz-style).
 *
 * Top-level status tabs (All / To Pay / To Ship / To Receive / Completed
 * / Cancelled / Refunded). Each order is shown as a card with a row of
 * item previews, total, and contextual action buttons.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ShoppingBag, Package, Truck, CheckCircle2, XCircle,
    RotateCcw, ChevronRight, Search, Loader2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { listMyOrders, cancelOrder, type OrderStatusTab } from '@/services/orders.service'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OrderItemPreview {
    product_name: string
    quantity: number
    image_url: string | null
}

interface Order {
    id: string
    order_number: string
    store: string
    store_name: string
    total_amount: string
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
    order_status: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
    item_count: number
    items_preview: OrderItemPreview[]
    cancelled_at: string | null
    cancellation_reason: string | null
    created_at: string
}

interface TabDef {
    key: OrderStatusTab
    label: string
    icon: React.ElementType
}

const TABS: TabDef[] = [
    { key: 'all',         label: 'All',         icon: ShoppingBag  },
    { key: 'to_pay',      label: 'To Pay',      icon: Package      },
    { key: 'to_ship',     label: 'To Ship',     icon: Package      },
    { key: 'to_receive',  label: 'To Receive',  icon: Truck        },
    { key: 'completed',   label: 'Completed',   icon: CheckCircle2 },
    { key: 'cancelled',   label: 'Cancelled',   icon: XCircle      },
    { key: 'refunded',    label: 'Refunded',    icon: RotateCcw    },
]

// Map an order's combined status to a display badge.
function getStatusBadge(order: Order) {
    if (order.order_status === 'cancelled') {
        return { label: 'Cancelled', color: 'bg-red-50 text-red-700' }
    }
    if (order.payment_status === 'refunded' || order.payment_status === 'partially_refunded') {
        return { label: 'Refunded', color: 'bg-purple-50 text-purple-700' }
    }
    if (order.payment_status === 'pending') {
        return { label: 'Awaiting Payment', color: 'bg-amber-50 text-amber-700' }
    }
    if (order.order_status === 'shipped') {
        return { label: 'Shipped', color: 'bg-blue-50 text-blue-700' }
    }
    if (order.order_status === 'delivered') {
        return { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700' }
    }
    if (['placed', 'confirmed', 'packed'].includes(order.order_status)) {
        return { label: 'Preparing', color: 'bg-indigo-50 text-indigo-700' }
    }
    return { label: order.order_status, color: 'bg-gray-100 text-gray-700' }
}

// What action buttons should be shown for each order, based on status.
function getActions(order: Order): Array<{ label: string; href?: string; onClick?: () => Promise<void>; primary?: boolean }> {
    const actions: Array<{ label: string; href?: string; onClick?: () => Promise<void>; primary?: boolean }> = []

    // View details — always available
    actions.push({ label: 'View Details', href: `/orders/${order.id}` })

    if (order.order_status === 'cancelled') return actions
    if (order.payment_status === 'pending') {
        actions.push({ label: 'Pay Now', href: `/checkout?order=${order.id}`, primary: true })
    }
    if (order.order_status === 'shipped') {
        actions.push({ label: 'Track Order', href: `/orders/${order.id}` })
    }
    if (order.order_status === 'delivered') {
        actions.push({ label: 'Rate / Review', href: `/orders/${order.id}#review`, primary: true })
        actions.push({ label: 'Request Return', href: `/account/returns?order=${order.id}` })
        actions.push({ label: 'Buy Again', href: `/products/${order.id}` })
    }
    return actions
}

export default function MyOrdersPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<OrderStatusTab>('all')
    const [search, setSearch] = useState('')

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['my-orders', activeTab],
        queryFn: () => listMyOrders({
            ordering: '-created_at',
            ...(activeTab !== 'all' ? { status: activeTab } : {}),
        }),
        staleTime: 30_000,
    })

    const allOrders: Order[] = data?.data?.results || data?.results || data?.data || data || []

    // Client-side search across order # and item names
    const orders = search.trim()
        ? allOrders.filter((o) => {
              const q = search.toLowerCase()
              return o.order_number?.toLowerCase().includes(q) ||
                  o.items_preview?.some((it) => it.product_name?.toLowerCase().includes(q))
          })
        : allOrders

    const handleCancel = async (orderId: string) => {
        if (!confirm('Cancel this order? This cannot be undone.')) return
        try {
            await cancelOrder(orderId, 'Cancelled by user')
            toast.success('Order cancelled.')
            refetch()
        } catch {
            toast.error('Failed to cancel order. It may already be processed.')
        }
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Tabs bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100">
                    {TABS.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all',
                                    isActive
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-900',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by order number or product"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 pl-10 bg-gray-50"
                        />
                    </div>
                </div>
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
                    <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {search ? 'No matching orders' : 'No orders here'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                        {search
                            ? 'Try a different search term.'
                            : activeTab === 'all'
                                ? "You haven't placed any orders yet."
                                : 'No orders in this category.'}
                    </p>
                    {!search && activeTab === 'all' && (
                        <Link href="/shop">
                            <Button className="bg-brand-primary hover:bg-brand-dark">
                                Start Shopping
                            </Button>
                        </Link>
                    )}
                </div>
            )}

            {/* Orders list */}
            {!isLoading && orders.length > 0 && (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const badge = getStatusBadge(order)
                        const actions = getActions(order)
                        const canCancel = order.order_status === 'placed' && order.payment_status !== 'paid'
                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Header — store + status */}
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
                                    <span className={cn(
                                        'text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded',
                                        badge.color,
                                    )}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Items preview row */}
                                <div className="p-5 space-y-3">
                                    {(order.items_preview || []).slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {item.image_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="h-6 w-6 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {order.item_count > 3 && (
                                        <p className="text-xs text-gray-400 pl-20">
                                            + {order.item_count - 3} more item(s)
                                        </p>
                                    )}
                                </div>

                                {/* Footer — total + actions */}
                                <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs text-gray-500">Order Total:</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            ৳{parseFloat(order.total_amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {canCancel && (
                                            <button
                                                onClick={() => handleCancel(order.id)}
                                                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                        {actions.map((action, idx) => (
                                            action.href ? (
                                                <Link
                                                    key={idx}
                                                    href={action.href}
                                                    className={cn(
                                                        'text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-md transition-colors',
                                                        action.primary
                                                            ? 'bg-brand-primary text-white hover:bg-brand-dark'
                                                            : 'border border-gray-200 text-gray-700 hover:border-brand-primary hover:text-brand-primary',
                                                    )}
                                                >
                                                    {action.label}
                                                </Link>
                                            ) : (
                                                <button
                                                    key={idx}
                                                    onClick={action.onClick}
                                                    className={cn(
                                                        'text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-md transition-colors',
                                                        action.primary
                                                            ? 'bg-brand-primary text-white hover:bg-brand-dark'
                                                            : 'border border-gray-200 text-gray-700 hover:border-brand-primary hover:text-brand-primary',
                                                    )}
                                                >
                                                    {action.label}
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </div>

                                {/* Cancellation reason banner */}
                                {order.order_status === 'cancelled' && order.cancellation_reason && (
                                    <div className="px-5 py-3 bg-red-50 border-t border-red-100 text-xs text-red-700">
                                        <span className="font-semibold">Cancellation reason:</span> {order.cancellation_reason}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
