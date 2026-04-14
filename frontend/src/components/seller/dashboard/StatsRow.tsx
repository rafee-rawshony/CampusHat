'use client'

import React from 'react'
import { TrendingUp, ShoppingBag, Package, Star, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

interface StatsRowProps {
    stats: any
    isLoading: boolean
}

export function StatsRow({ stats, isLoading }: StatsRowProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-[140px]"></div>
                ))}
            </div>
        )
    }

    const {
        total_revenue = 0,
        revenue_change_pct = 0,
        total_orders = 0,
        orders_awaiting = 0,
        active_products = 0,
        rating_avg = 0,
        rating_count = 0,
    } = stats || {}

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Revenue */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-500 text-sm">Total Revenue</span>
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-2xl text-gray-900 mb-1">৳{total_revenue.toLocaleString()}</h3>
                    {revenue_change_pct > 0 ? (
                        <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                            <ArrowUp className="w-3 h-3" />
                            +{revenue_change_pct}% this month
                        </p>
                    ) : revenue_change_pct < 0 ? (
                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                            <ArrowDown className="w-3 h-3" />
                            {revenue_change_pct}% this month
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 font-medium">Same as last month</p>
                    )}
                </div>
                <Link href="/seller/wallet" className="text-[#4C3B8A] text-[10px] font-bold mt-3 inline-block hover:underline uppercase tracking-wide">
                    INSIGHT →
                </Link>
            </div>

            {/* Card 2: Orders */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-500 text-sm">Total Orders</span>
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-2xl text-gray-900 mb-1">{total_orders}</h3>
                    {orders_awaiting > 0 ? (
                        <p className="text-xs text-orange-500 font-bold tracking-tight">
                            {orders_awaiting} awaiting fulfillment
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 font-medium">
                            All orders fulfilled
                        </p>
                    )}
                </div>
                <Link href="/seller/orders" className="text-[#4C3B8A] text-[10px] font-bold mt-3 inline-block hover:underline uppercase tracking-wide">
                    INSIGHT →
                </Link>
            </div>

            {/* Card 3: Products */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-500 text-sm">Live Products</span>
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-2xl text-gray-900 mb-1">{active_products}</h3>
                    <p className="text-xs text-gray-400 font-medium">
                        Active listings
                    </p>
                </div>
                <Link href="/seller/products" className="text-[#4C3B8A] text-[10px] font-bold mt-3 inline-block hover:underline uppercase tracking-wide">
                    INSIGHT →
                </Link>
            </div>

            {/* Card 4: Rating */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-500 text-sm">Avg Rating</span>
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 fill-current" />
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-2xl text-[#FBBF24] mb-1">{Number(rating_avg || 0).toFixed(1)} ★</h3>
                    <p className="text-xs text-gray-400 font-medium">
                        from {rating_count} reviews
                    </p>
                </div>
                <Link href="/seller/settings" className="text-[#4C3B8A] text-[10px] font-bold mt-3 inline-block hover:underline uppercase tracking-wide">
                    INSIGHT →
                </Link>
            </div>
        </div>
    )
}
