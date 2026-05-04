'use client'

/**
 * Daraz-style Quick Actions widget — 3 prominent shortcuts at the top of
 * the seller dashboard (Add Product / View Orders / Update Stock).
 */

import Link from 'next/link'
import { Plus, ShoppingBag, Package, ArrowRight } from 'lucide-react'

const actions = [
    {
        label: 'Add Product',
        sub: 'List a new item in your store',
        href: '/seller/products?new=1',
        icon: Plus,
        bg: 'bg-gradient-to-br from-brand-primary to-brand-dark',
        textColor: 'text-white',
    },
    {
        label: 'View Orders',
        sub: 'Manage incoming customer orders',
        href: '/seller/orders',
        icon: ShoppingBag,
        bg: 'bg-white border border-gray-200',
        textColor: 'text-gray-900',
    },
    {
        label: 'Update Stock',
        sub: 'Manage product inventory',
        href: '/seller/inventory',
        icon: Package,
        bg: 'bg-white border border-gray-200',
        textColor: 'text-gray-900',
    },
]

export function QuickActions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {actions.map((a) => {
                const Icon = a.icon
                const isPrimary = a.bg.includes('gradient')
                return (
                    <Link
                        key={a.href}
                        href={a.href}
                        className={`${a.bg} ${a.textColor} rounded-xl p-5 flex items-center gap-4 hover:shadow-lg transition-all group`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isPrimary ? 'bg-white/20' : 'bg-brand-light text-brand-primary'
                        }`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-base">{a.label}</p>
                            <p className={`text-xs ${isPrimary ? 'text-white/80' : 'text-gray-500'}`}>{a.sub}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform ${
                            isPrimary ? 'text-white' : 'text-gray-400'
                        }`} />
                    </Link>
                )
            })}
        </div>
    )
}
