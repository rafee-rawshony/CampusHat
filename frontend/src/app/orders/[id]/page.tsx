'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
    ArrowLeft, Package, Truck, CheckCircle2, XCircle,
    Clock, ShoppingBag, FileText, Copy, RotateCcw
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const STATUS_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: ShoppingBag },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'packed', label: 'Packed', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

function getStepIndex(status: string) {
    if (status === 'cancelled') return -1
    const idx = STATUS_STEPS.findIndex(s => s.key === status)
    return idx >= 0 ? idx : 0
}

export default function BuyerOrderDetailPage() {
    const { id } = useParams()
    const router = useRouter()

    const { data: order, isLoading, refetch } = useQuery({
        queryKey: ['buyer-order-detail', id],
        queryFn: async () => {
            const res = await api.get(`/orders/${id}/`)
            return res.data?.data || res.data
        },
        enabled: !!id,
    })

    const { data: tracking } = useQuery({
        queryKey: ['order-tracking', id],
        queryFn: async () => {
            const res = await api.get(`/orders/${id}/tracking/`)
            return res.data?.data || res.data || []
        },
        enabled: !!id,
    })

    const handleCancel = async () => {
        if (!confirm('Cancel this order? This cannot be undone.')) return
        try {
            await api.post(`/orders/${id}/cancel/`, { reason: 'Cancelled by buyer' })
            toast.success('Order cancelled.')
            refetch()
        } catch {
            toast.error('Failed to cancel. Order may already be processed.')
        }
    }

    const copyOrderNumber = () => {
        navigator.clipboard.writeText(order?.order_number || '')
        toast.success('Order number copied!')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                <Button onClick={() => router.push('/account/orders')}>Back to Orders</Button>
            </div>
        )
    }

    const currentStep = getStepIndex(order.order_status)
    const isCancelled = order.order_status === 'cancelled'
    const canCancel = order.order_status === 'placed'
    const isDelivered = order.order_status === 'delivered'
    const trackingHistory: any[] = Array.isArray(tracking) ? tracking : tracking?.history || []

    return (
        <div className="min-h-screen bg-[#F5F5F5] py-6 md:py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Back Button + Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.push('/account/orders')} className="p-2 hover:bg-white rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500">#{order.order_number}</span>
                            <button onClick={copyOrderNumber} className="text-gray-400 hover:text-gray-600">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <span className={cn(
                        'text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full',
                        isCancelled ? 'bg-red-50 text-red-700' :
                        isDelivered ? 'bg-emerald-50 text-emerald-700' :
                        'bg-[#4C3B8A]/10 text-[#4C3B8A]'
                    )}>
                        {order.order_status}
                    </span>
                </div>

                {/* Tracking Timeline */}
                {!isCancelled && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-8">Order Tracking</h2>

                        {/* Horizontal Timeline (Desktop) */}
                        <div className="hidden md:flex items-start justify-between relative">
                            {/* Progress Line */}
                            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200">
                                <div
                                    className="h-full bg-[#4C3B8A] transition-all duration-700 ease-out"
                                    style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                                />
                            </div>

                            {STATUS_STEPS.map((step, i) => {
                                const isActive = i <= currentStep
                                const isCurrent = i === currentStep
                                const StepIcon = step.icon
                                return (
                                    <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                                        <div className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500',
                                            isCurrent
                                                ? 'bg-[#4C3B8A] border-[#4C3B8A] text-white scale-110 shadow-lg shadow-[#4C3B8A]/30'
                                                : isActive
                                                    ? 'bg-[#4C3B8A] border-[#4C3B8A] text-white'
                                                    : 'bg-white border-gray-200 text-gray-400'
                                        )}>
                                            <StepIcon className="w-5 h-5" />
                                        </div>
                                        <p className={cn(
                                            'text-xs font-bold mt-3 text-center',
                                            isActive ? 'text-[#4C3B8A]' : 'text-gray-400'
                                        )}>
                                            {step.label}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Vertical Timeline (Mobile) */}
                        <div className="md:hidden space-y-0">
                            {STATUS_STEPS.map((step, i) => {
                                const isActive = i <= currentStep
                                const isCurrent = i === currentStep
                                const StepIcon = step.icon
                                const historyEntry = trackingHistory.find((h: any) => h.to_status === step.key)
                                return (
                                    <div key={step.key} className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
                                                isCurrent
                                                    ? 'bg-[#4C3B8A] border-[#4C3B8A] text-white scale-110'
                                                    : isActive
                                                        ? 'bg-[#4C3B8A] border-[#4C3B8A] text-white'
                                                        : 'bg-white border-gray-200 text-gray-400'
                                            )}>
                                                <StepIcon className="w-4 h-4" />
                                            </div>
                                            {i < STATUS_STEPS.length - 1 && (
                                                <div className={cn(
                                                    'w-0.5 h-10',
                                                    isActive ? 'bg-[#4C3B8A]' : 'bg-gray-200'
                                                )} />
                                            )}
                                        </div>
                                        <div className="pb-8 pt-1">
                                            <p className={cn('text-sm font-bold', isActive ? 'text-gray-900' : 'text-gray-400')}>
                                                {step.label}
                                            </p>
                                            {historyEntry && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(historyEntry.created_at).toLocaleString('en-BD', {
                                                        dateStyle: 'medium', timeStyle: 'short'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {order.tracking_code && (
                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">Tracking Code:</span>
                                <span className="text-sm font-bold text-gray-900">{order.tracking_code}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Cancelled Banner */}
                {isCancelled && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-4 flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-red-800">Order Cancelled</p>
                            {order.cancellation_reason && (
                                <p className="text-sm text-red-600 mt-1">Reason: {order.cancellation_reason}</p>
                            )}
                            {order.cancelled_at && (
                                <p className="text-xs text-red-400 mt-1">
                                    Cancelled on {new Date(order.cancelled_at).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Items ({order.items?.length || 0})</h2>
                    <div className="space-y-4">
                        {(order.items || order.items_preview || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                    {(item.image_url || item.product_image) ? (
                                        <img src={item.image_url || item.product_image} alt={item.product_name || item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-6 h-6 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name_snapshot || item.product_name || item.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-900">
                                        ৳{parseFloat(item.line_total || item.unit_price || '0').toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Payment Summary</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-semibold text-gray-900">৳{parseFloat(order.subtotal || '0').toLocaleString()}</span>
                        </div>
                        {parseFloat(order.discount_amount || '0') > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Discount</span>
                                <span className="font-semibold">-৳{parseFloat(order.discount_amount).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Delivery Fee</span>
                            <span className="font-semibold text-gray-900">৳{parseFloat(order.delivery_fee || '0').toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-between">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="text-xl font-black text-gray-900">৳{parseFloat(order.total_amount || '0').toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Address */}
                {order.delivery_address_snapshot && Object.keys(order.delivery_address_snapshot).length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Delivery Address</h2>
                        <p className="text-sm text-gray-700 font-medium">{order.delivery_address_snapshot.full_name}</p>
                        <p className="text-sm text-gray-500 mt-1">{order.delivery_address_snapshot.phone}</p>
                        <p className="text-sm text-gray-500">{order.delivery_address_snapshot.campus_building}, Room {order.delivery_address_snapshot.room_number}</p>
                        {order.delivery_address_snapshot.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">Note: {order.delivery_address_snapshot.notes}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    {canCancel && (
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl"
                        >
                            <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                        </Button>
                    )}
                    {isDelivered && (
                        <Link href={`/account/returns?order=${id}`}>
                            <Button variant="outline" className="border-gray-200 text-gray-700 font-semibold rounded-xl">
                                <RotateCcw className="w-4 h-4 mr-2" /> Request Return
                            </Button>
                        </Link>
                    )}
                    <Link href={`/orders/${id}/invoice`}>
                        <Button variant="outline" className="border-gray-200 text-gray-700 font-semibold rounded-xl">
                            <FileText className="w-4 h-4 mr-2" /> Invoice
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
