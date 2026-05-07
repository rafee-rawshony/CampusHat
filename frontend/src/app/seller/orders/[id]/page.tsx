'use client'

/**
 * Seller order detail page (Daraz-style).
 *
 * Shows full order info: items, delivery address snapshot, payment, totals,
 * status history timeline, plus action buttons appropriate to the current
 * status (Confirm / Pack / Ship). Includes a Print Invoice action.
 */

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ArrowLeft, Loader2, Package, Phone, Mail, MapPin, User as UserIcon,
    Truck, CheckCircle2, Clock, XCircle, Printer, MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrderItem {
    id: string
    product: string
    product_slug?: string
    product_name_snapshot: string
    variant_name?: string | null
    unit_price: string
    quantity: number
    line_total: string
}

interface StatusHistoryEntry {
    id: string
    from_status: string
    to_status: string
    changed_by_email?: string
    changed_by_role?: string
    note?: string
    created_at: string
}

interface OrderDetail {
    id: string
    order_number: string
    buyer_email?: string
    delivery_address_snapshot?: Record<string, string | undefined>
    subtotal: string
    discount_amount: string
    delivery_fee: string
    total_amount: string
    platform_commission: string
    seller_net_amount: string
    payment_status: string
    order_status: string
    buyer_note?: string | null
    tracking_code?: string | null
    cancelled_at?: string | null
    cancellation_reason?: string | null
    items: OrderItem[]
    status_history: StatusHistoryEntry[]
    created_at: string
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    placed:     { label: 'Placed',     color: 'bg-blue-50 text-blue-700' },
    confirmed:  { label: 'Confirmed',  color: 'bg-indigo-50 text-indigo-700' },
    packed:     { label: 'Packed',     color: 'bg-purple-50 text-purple-700' },
    shipped:    { label: 'Shipped',    color: 'bg-cyan-50 text-cyan-700' },
    delivered:  { label: 'Delivered',  color: 'bg-emerald-50 text-emerald-700' },
    cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-700' },
}

const PAYMENT_BADGE: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700' },
    paid:      { label: 'Paid',      color: 'bg-emerald-50 text-emerald-700' },
    failed:    { label: 'Failed',    color: 'bg-red-50 text-red-700' },
    refunded:  { label: 'Refunded',  color: 'bg-purple-50 text-purple-700' },
}

export default function SellerOrderDetailPage() {
    const router = useRouter()
    const params = useParams()
    const queryClient = useQueryClient()
    const orderId = params?.id as string

    const [trackingCode, setTrackingCode] = useState('')

    const { data: order, isLoading } = useQuery<OrderDetail>({
        queryKey: ['seller-order', orderId],
        queryFn: () => api.get(`/seller/orders/${orderId}/`).then(r => r.data?.data || r.data),
        enabled: !!orderId,
    })

    // Generic transition mutation — confirm / pack / ship. Backend uses PATCH.
    const transitionMutation = useMutation({
        mutationFn: async ({ action, body }: { action: 'confirm' | 'pack' | 'ship'; body?: Record<string, unknown> }) => {
            const { data } = await api.patch(`/seller/orders/${orderId}/${action}/`, body || {})
            return data
        },
        onSuccess: (_, vars) => {
            toast.success(`Order ${vars.action === 'confirm' ? 'confirmed' : vars.action === 'pack' ? 'packed' : 'shipped'}.`)
            queryClient.invalidateQueries({ queryKey: ['seller-order', orderId] })
            queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
            queryClient.invalidateQueries({ queryKey: ['seller-stats'] })
        },
        onError: (err: unknown) => {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e.response?.data?.message || 'Action failed.')
        },
    })

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
    }
    if (!order) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Order not found.</p>
                <Link href="/seller/orders" className="text-brand-primary hover:underline text-sm mt-2 inline-block">
                    Back to orders
                </Link>
            </div>
        )
    }

    const statusBadge = STATUS_BADGE[order.order_status] || { label: order.order_status, color: 'bg-gray-100 text-gray-700' }
    const paymentBadge = PAYMENT_BADGE[order.payment_status] || { label: order.payment_status, color: 'bg-gray-100 text-gray-700' }
    const addr = order.delivery_address_snapshot || {}

    // Decide which action button to show based on the current status.
    const canConfirm = order.order_status === 'placed'
    const canPack = order.order_status === 'confirmed'
    const canShip = order.order_status === 'packed'

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-brand-primary p-1">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-xl text-gray-900">
                            Order #{order.order_number}
                        </h1>
                        <p className="text-xs text-gray-500">
                            Placed on {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded ${statusBadge.color}`}>
                        {statusBadge.label}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded ${paymentBadge.color}`}>
                        Payment: {paymentBadge.label}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* LEFT — items + actions + history */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Action card */}
                    {(canConfirm || canPack || canShip) && (
                        <div className="bg-white rounded-xl border border-gray-100 p-5">
                            <h2 className="font-bold text-sm text-gray-900 mb-3">Order Actions</h2>
                            {canConfirm && (
                                <Button
                                    onClick={() => transitionMutation.mutate({ action: 'confirm' })}
                                    disabled={transitionMutation.isPending}
                                    className="bg-brand-primary hover:bg-brand-dark"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Order
                                </Button>
                            )}
                            {canPack && (
                                <Button
                                    onClick={() => transitionMutation.mutate({ action: 'pack' })}
                                    disabled={transitionMutation.isPending}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    <Package className="w-4 h-4 mr-2" /> Mark as Packed
                                </Button>
                            )}
                            {canShip && (
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="tracking">Tracking Code (optional)</Label>
                                        <Input
                                            id="tracking"
                                            value={trackingCode}
                                            onChange={(e) => setTrackingCode(e.target.value)}
                                            placeholder="e.g. CH-TRK-XXXXXXXX"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => transitionMutation.mutate({
                                            action: 'ship',
                                            body: trackingCode ? { tracking_code: trackingCode } : undefined,
                                        })}
                                        disabled={transitionMutation.isPending}
                                        className="bg-cyan-600 hover:bg-cyan-700"
                                    >
                                        <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Items */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="font-bold text-sm text-gray-900 mb-4">
                            Items ({order.items.length})
                        </h2>
                        <div className="space-y-3 divide-y divide-gray-100">
                            {order.items.map((it) => (
                                <div key={it.id} className="flex items-start gap-4 pt-3 first:pt-0">
                                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <Package className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{it.product_name_snapshot}</p>
                                        {it.variant_name && (
                                            <p className="text-xs text-gray-500 mt-0.5">Variant: {it.variant_name}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            ৳{Number(it.unit_price).toLocaleString()} × {it.quantity}
                                        </p>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">
                                        ৳{Number(it.line_total).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>৳{Number(order.subtotal).toLocaleString()}</span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span>-৳{Number(order.discount_amount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery</span>
                                <span>৳{Number(order.delivery_fee).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t border-gray-100">
                                <span>Order Total</span>
                                <span>৳{Number(order.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 pt-2 text-xs">
                                <span>Platform commission</span>
                                <span>-৳{Number(order.platform_commission).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 font-bold">
                                <span>Your Net Earning</span>
                                <span>৳{Number(order.seller_net_amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status history timeline */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="font-bold text-sm text-gray-900 mb-4">Status Timeline</h2>
                        {order.status_history.length === 0 ? (
                            <p className="text-xs text-gray-400">No status changes yet.</p>
                        ) : (
                            <ol className="relative border-l-2 border-gray-100 pl-5 space-y-4">
                                {order.status_history.map((h) => (
                                    <li key={h.id} className="relative">
                                        <span className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-brand-primary ring-4 ring-white"></span>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {h.from_status} → {h.to_status}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(h.created_at).toLocaleString()} · by {h.changed_by_role || 'system'}
                                        </p>
                                        {h.note && <p className="text-xs text-gray-600 mt-1 italic">&quot;{h.note}&quot;</p>}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

                {/* RIGHT — customer + actions sidebar */}
                <div className="space-y-4">
                    {/* Print Invoice + Contact */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(`/seller/orders/${orderId}/invoice`, '_blank')}
                        >
                            <Printer className="w-4 h-4 mr-2" /> Print Invoice
                        </Button>
                        <Link href={`/seller/messages?email=${order.buyer_email}`}>
                            <Button variant="outline" className="w-full">
                                <MessageSquare className="w-4 h-4 mr-2" /> Contact Customer
                            </Button>
                        </Link>
                    </div>

                    {/* Customer info */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <UserIcon className="h-4 w-4" /> Customer
                        </h2>
                        <div className="space-y-2 text-sm">
                            {order.buyer_email && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="truncate">{order.buyer_email}</span>
                                </div>
                            )}
                            {addr.recipient_phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{addr.recipient_phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delivery address */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Delivery Address
                        </h2>
                        {addr.recipient_name ? (
                            <div className="text-sm text-gray-700 space-y-1">
                                <p className="font-semibold text-gray-900">{addr.recipient_name}</p>
                                <p>{addr.address_line1}</p>
                                {addr.area && <p className="text-gray-600">{addr.area}</p>}
                                <p className="text-gray-600">
                                    {[addr.city, addr.district, addr.division].filter(Boolean).join(', ')}
                                    {addr.postal_code ? ` - ${addr.postal_code}` : ''}
                                </p>
                                {addr.landmark && (
                                    <p className="text-xs text-gray-500 italic mt-1">Landmark: {addr.landmark}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">No address on file.</p>
                        )}
                    </div>

                    {/* Buyer note */}
                    {order.buyer_note && (
                        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                            <h2 className="font-bold text-xs text-amber-800 mb-2 uppercase">Buyer Note</h2>
                            <p className="text-sm text-amber-700">{order.buyer_note}</p>
                        </div>
                    )}

                    {/* Cancellation reason */}
                    {order.order_status === 'cancelled' && order.cancellation_reason && (
                        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                            <h2 className="font-bold text-xs text-red-800 mb-2 uppercase">Cancellation Reason</h2>
                            <p className="text-sm text-red-700">{order.cancellation_reason}</p>
                        </div>
                    )}

                    {/* Tracking */}
                    {order.tracking_code && (
                        <div className="bg-cyan-50 rounded-xl border border-cyan-200 p-4">
                            <h2 className="font-bold text-xs text-cyan-800 mb-2 uppercase">Tracking</h2>
                            <p className="text-sm text-cyan-700 font-mono">{order.tracking_code}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
