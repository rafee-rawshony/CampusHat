'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    BarChart3,
    RefreshCcw,
    Store,
    Grid,
    ShoppingBag,
    Users,
    Building2,
    Tags,
    TerminalSquare,
    Plus
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, isAdmin, isModerator } = useAuthStore()

    // Track pending items for the red badge
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }
        if (!isAdmin() && !isModerator()) {
            router.push('/') // Redirect normal users away
            return
        }

        // Fetch hypothetical aggregated pending count
        api.get('/admin/approvals/pending-count/')
            .then(res => setPendingCount(res.data.total || 0))
            .catch(() => setPendingCount(0)) // fail silently on layout
    }, [isAuthenticated, router, isAdmin, isModerator])

    if (!isAuthenticated || (!isAdmin() && !isModerator())) {
        return null // or loading spinner
    }

    const navLinks = [
        {
            section: 'MAIN',
            items: [
                { label: 'Analytics', href: '/admin', icon: <BarChart3 className="w-5 h-5" /> },
                { label: 'Pending Approvals', href: '/admin/approvals', icon: <RefreshCcw className="w-5 h-5" />, badge: pendingCount },
            ]
        },
        {
            section: 'COMMERCE',
            items: [
                { label: 'Mall Products', href: '/admin/mall-products', icon: <Store className="w-5 h-5" /> },
                { label: 'Marketplace', href: '/admin/marketplace', icon: <Grid className="w-5 h-5" /> },
                { label: 'Orders', href: '/admin/orders', icon: <ShoppingBag className="w-5 h-5" /> },
            ]
        },
        {
            section: 'SYSTEM',
            items: [
                { label: 'User Directory', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
                { label: 'Campuses', href: '/admin/campuses', icon: <Building2 className="w-5 h-5" /> },
                { label: 'Categories', href: '/admin/categories', icon: <Tags className="w-5 h-5" /> },
                { label: 'Activity Logs', href: '/admin/activity', icon: <TerminalSquare className="w-5 h-5" /> },
            ]
        }
    ]

    return (
        <div className="flex h-screen overflow-hidden bg-[#F5F5F5] font-sans">

            {/* Sidebar - Fixed */}
            <aside className="w-[240px] flex-shrink-0 bg-[#2D1B69] text-white flex flex-col h-full shadow-xl z-20">

                {/* Admin Identity Card */}
                <div className="p-6 border-b border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-xl shadow-inner">
                        {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base leading-tight">Admin Console</span>
                        <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium mt-0.5">
                            {isAdmin() ? 'SUPER ADMIN' : 'MODERATOR'}
                        </span>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin scrollbar-thumb-white/20">
                    {navLinks.map((group, i) => (
                        <div key={i}>
                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3 px-3">
                                {group.section}
                            </h3>
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative
                          ${isActive
                                                        ? 'bg-white/10 text-white font-medium'
                                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-400 rounded-r-full" />
                                                )}
                                                <span className={isActive ? 'text-purple-300' : 'text-white/50'}>
                                                    {item.icon}
                                                </span>
                                                <span className="text-sm">{item.label}</span>

                                                {item.badge !== undefined && item.badge > 0 && (
                                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                        {item.badge > 99 ? '99+' : item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Top Bar matching Marketplace styling */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
                    <div className="text-sm font-semibold text-gray-800">
                        Welcome to CampusHat Marketplace
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            Hi, <span className="font-bold">{user?.full_name || 'Admin'}</span>
                        </span>
                        <Button onClick={() => router.push('/marketplace/post')} size="sm" className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full font-bold shadow-md shadow-purple-500/20">
                            <Plus className="w-4 h-4 mr-1" /> Post Ad
                        </Button>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth">
                    {children}
                </div>

            </main>

        </div>
    )
}

// Inline fallback for layout Button if shared one causes client-tree issues
function Button({ children, onClick, className, size = 'default' }: any) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center justify-center transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${className} ${size === 'sm' ? 'h-9 px-4 text-xs' : 'h-10 px-4 py-2 text-sm'}`}
        >
            {children}
        </button>
    )
}
