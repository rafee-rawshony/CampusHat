'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Truck, Copy, PartyPopper } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function OrderSuccessPage() {
    const { id } = useParams()
    const router = useRouter()
    const [showConfetti, setShowConfetti] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 4000)
        return () => clearTimeout(timer)
    }, [])

    const { data: order, isLoading } = useQuery({
        queryKey: ['order-success', id],
        queryFn: async () => {
            const res = await api.get(`/orders/${id}/`)
            return res.data?.data || res.data
        },
        enabled: !!id,
        retry: 2,
    })

    const copyOrderNumber = () => {
        const num = order?.order_number || (id as string).slice(0, 8).toUpperCase()
        navigator.clipboard.writeText(num)
        toast.success('Order number copied!')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] py-8 md:py-16 relative overflow-hidden">
            {/* Confetti Particles */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}%`,
                                backgroundColor: ['#4C3B8A', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#EF4444'][i % 6],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 3}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="max-w-2xl mx-auto px-4">
                {/* Success Card */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#4C3B8A] to-[#6B5BAA] px-8 py-12 text-center relative">
                        <div className="absolute top-4 right-4 opacity-20">
                            <PartyPopper className="w-16 h-16 text-white" />
                        </div>
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">Order Placed!</h1>
                        <p className="text-white/80 font-medium">Thank you for your purchase 🎉</p>
                    </div>

                    {/* Order Info */}
                    <div className="p-8 space-y-6">
                        {/* Order Number */}
                        <div className="bg-gray-50 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Order Number</p>
                                <p className="text-xl font-black text-gray-900 tracking-wide">
                                    {order?.order_number || (id as string).slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={copyOrderNumber}
                                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                                title="Copy order number"
                            >
                                <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Status Timeline (mini) */}
                        <div className="flex items-center justify-between px-4">
                            {[
                                { icon: CheckCircle2, label: 'Placed', active: true },
                                { icon: Package, label: 'Confirmed', active: false },
                                { icon: Truck, label: 'Shipped', active: false },
                                { icon: CheckCircle2, label: 'Delivered', active: false },
                            ].map((step, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5 relative">
                                    <div className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                                        step.active
                                            ? 'bg-[#4C3B8A] text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    )}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        'text-[10px] font-bold uppercase tracking-wider',
                                        step.active ? 'text-[#4C3B8A]' : 'text-gray-400'
                                    )}>
                                        {step.label}
                                    </span>
                                    {i < 3 && (
                                        <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-8px)] h-0.5 bg-gray-200" style={{ width: '60px' }} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Order Details */}
                        {order && (
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Items</span>
                                    <span className="font-semibold text-gray-900">{order.items?.length || order.item_count || '—'} item(s)</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Payment Method</span>
                                    <span className="font-semibold text-gray-900 capitalize">{order.payment_method || 'Cash on Delivery'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Payment Status</span>
                                    <span className={cn(
                                        'font-bold text-xs uppercase px-2 py-0.5 rounded',
                                        order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                    )}>
                                        {order.payment_status || 'Pending'}
                                    </span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between">
                                    <span className="text-gray-500 font-medium">Total</span>
                                    <span className="text-2xl font-black text-gray-900">
                                        ৳{parseFloat(order.total_amount || '0').toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Estimated Delivery */}
                        <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
                            <Truck className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-emerald-800">Estimated Delivery</p>
                                <p className="text-xs text-emerald-600 font-medium">
                                    Within 3-5 business days to your campus address
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 pt-2">
                            <Link href={`/orders/${id}`}>
                                <Button className="w-full h-12 bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-bold rounded-xl">
                                    View Order Details
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/shop">
                                <Button variant="outline" className="w-full h-12 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confetti animation keyframe */}
            <style jsx>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-confetti {
                    animation: confetti linear forwards;
                }
                @keyframes bounce-once {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .animate-bounce-once {
                    animation: bounce-once 0.6s ease-out;
                }
            `}</style>
        </div>
    )
}
