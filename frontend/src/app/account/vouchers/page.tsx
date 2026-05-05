'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ticket, Copy, CheckCircle2, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Coupon {
    id: string
    code: string
    coupon_type: 'percentage' | 'fixed_amount' | 'free_delivery'
    discount_value: string
    minimum_order_amount: string
    maximum_discount_cap: string | null
    store_name: string | null
    expires_at: string
}

export default function VouchersPage() {
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
        queryKey: ['active-coupons'],
        queryFn: async () => {
            const res = await api.get('/coupons/active/')
            return res.data?.data || []
        }
    })

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        toast.success('Coupon code copied!')
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const formatDiscount = (coupon: Coupon) => {
        if (coupon.coupon_type === 'percentage') {
            return `${parseFloat(coupon.discount_value)}% OFF`
        } else if (coupon.coupon_type === 'fixed_amount') {
            return `৳${parseFloat(coupon.discount_value)} OFF`
        } else {
            return 'Free Delivery'
        }
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 md:px-8 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-brand-primary" />
                        My Vouchers
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Discover and use active vouchers to save on your next order.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                ) : coupons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {coupons.map(coupon => (
                            <div key={coupon.id} className="relative flex border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-brand-primary/50 hover:shadow-md transition-all group">
                                {/* Left stub */}
                                <div className="w-24 bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] flex flex-col items-center justify-center p-3 text-white border-r border-dashed border-gray-300 relative">
                                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-white rounded-full border-b border-gray-200" />
                                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full border-t border-gray-200" />
                                    <span className="text-xl font-black text-center leading-tight">
                                        {formatDiscount(coupon)}
                                    </span>
                                </div>
                                {/* Right body */}
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                {coupon.store_name ? `Store: ${coupon.store_name}` : 'Platform Voucher'}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                                            Min Spend: ৳{parseFloat(coupon.minimum_order_amount)}
                                        </h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Valid till: {new Date(coupon.expires_at).toLocaleDateString('en-BD')}
                                        </p>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 font-mono text-xs font-bold text-gray-700 tracking-wider">
                                            {coupon.code}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleCopy(coupon.code)}
                                            className="h-8 rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                                        >
                                            {copiedCode === coupon.code ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Ticket className="w-16 h-16 text-gray-200 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Vouchers</h3>
                        <p className="text-sm text-gray-500 max-w-sm">
                            There are no active vouchers available at the moment. Please check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
