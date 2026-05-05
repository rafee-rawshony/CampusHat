'use client'

/**
 * Daraz-style KPI grid for the seller dashboard.
 *
 * Each card has: label, big number, sub-text, color-coded icon, link.
 * Numbers come from /sellers/my-dashboard/.
 */

import React from 'react'
import {
    Package, AlertTriangle, ShoppingBag, Truck, CheckCircle2,
    XCircle, TrendingUp, DollarSign, Star, Box,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
    total_products?: number
    active_products?: number
    out_of_stock_products?: number
    low_stock_products?: number
    total_orders?: number
    pending_orders?: number
    shipped_orders?: number
    completed_orders?: number
    cancelled_orders?: number
    today_orders?: number
    today_revenue?: number
    total_revenue?: number
    average_rating?: number
    review_count?: number
}

interface StatsRowProps {
    stats?: DashboardStats
    isLoading: boolean
}

interface KpiDef {
    label: string
    value: number | string
    sub?: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
    href?: string
    accent?: 'default' | 'warning' | 'danger' | 'success'
}

// Format BDT — ৳1,234,567.
function bdt(n: number) {
    return `৳${Math.round(n).toLocaleString('en-IN')}`
}

export function StatsRow({ stats, isLoading }: StatsRowProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse h-[110px]" />
                ))}
            </div>
        )
    }

    const s = stats || {}

    // Section 1: Products
    const productCards: KpiDef[] = [
        {
            label: 'Total Products',
            value: s.total_products ?? 0,
            sub: `${s.active_products ?? 0} active`,
            icon: Package,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            href: '/seller/products',
        },
        {
            label: 'Out of Stock',
            value: s.out_of_stock_products ?? 0,
            sub: 'Products with 0 stock',
            icon: Box,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            href: '/seller/inventory',
            accent: (s.out_of_stock_products ?? 0) > 0 ? 'danger' : 'default',
        },
        {
            label: 'Low Stock',
            value: s.low_stock_products ?? 0,
            sub: 'Less than 5 units left',
            icon: AlertTriangle,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            href: '/seller/inventory',
            accent: (s.low_stock_products ?? 0) > 0 ? 'warning' : 'default',
        },
        {
            label: "Today's Orders",
            value: s.today_orders ?? 0,
            sub: bdt(s.today_revenue ?? 0) + ' earned',
            icon: ShoppingBag,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            href: '/seller/orders',
        },
    ]

    // Section 2: Orders + Revenue
    const orderCards: KpiDef[] = [
        {
            label: 'Pending Orders',
            value: s.pending_orders ?? 0,
            sub: 'Awaiting fulfillment',
            icon: Truck,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            href: '/seller/orders?status=pending',
            accent: (s.pending_orders ?? 0) > 0 ? 'warning' : 'default',
        },
        {
            label: 'Completed',
            value: s.completed_orders ?? 0,
            sub: 'Delivered successfully',
            icon: CheckCircle2,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            href: '/seller/orders?status=completed',
        },
        {
            label: 'Cancelled',
            value: s.cancelled_orders ?? 0,
            sub: 'Orders cancelled',
            icon: XCircle,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-500',
            href: '/seller/orders?status=cancelled',
        },
        {
            label: 'Total Revenue',
            value: bdt(s.total_revenue ?? 0),
            sub: 'Lifetime earnings',
            icon: DollarSign,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
            href: '/seller/wallet',
            accent: 'success',
        },
    ]

    const renderCard = (k: KpiDef, idx: number) => {
        const Icon = k.icon
        const valueColor = k.accent === 'danger'
            ? 'text-red-600'
            : k.accent === 'warning'
                ? 'text-amber-600'
                : k.accent === 'success'
                    ? 'text-emerald-600'
                    : 'text-gray-900'
        const card = (
            <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-brand-primary/30 transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{k.label}</span>
                    <div className={`w-9 h-9 rounded-lg ${k.iconBg} ${k.iconColor} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>
                <p className={`font-bold text-2xl ${valueColor} leading-tight mb-1`}>
                    {k.value}
                </p>
                {k.sub && <p className="text-[11px] text-gray-500">{k.sub}</p>}
            </div>
        )
        return k.href
            ? <Link key={idx} href={k.href}>{card}</Link>
            : <div key={idx}>{card}</div>
    }

    return (
        <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {productCards.map(renderCard)}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {orderCards.map(renderCard)}
            </div>

            {/* Rating + reviews compact row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/seller/reviews">
                    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-brand-primary/30 transition-all flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
                            <Star className="w-5 h-5 fill-current" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Rating</p>
                            <p className="font-bold text-2xl text-gray-900">
                                {Number(s.average_rating ?? 0).toFixed(1)} <span className="text-yellow-500">★</span>
                            </p>
                            <p className="text-[11px] text-gray-500">From {s.review_count ?? 0} reviews</p>
                        </div>
                    </div>
                </Link>
                <Link href="/seller/orders">
                    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-brand-primary/30 transition-all flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</p>
                            <p className="font-bold text-2xl text-gray-900">{s.total_orders ?? 0}</p>
                            <p className="text-[11px] text-gray-500">All time</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
