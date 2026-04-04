'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import {
    BarChart3, RefreshCw, Store, Grid, ShoppingBag,
    Users, Building2, Tags, CodeSquare, LogOut, Plus
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, isAdmin, isModerator, isSellerModerator, isMarketplaceModerator, logout } = useAuthStore()
    const [permissions, setPermissions] = useState<string[]>([])
    const { setPendingCounts, pendingCounts } = useAdminStore()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }
        if (!isAdmin() && !isModerator()) {
            router.push('/unauthorized')
            return
        }

        if (isModerator() && !isAdmin()) {
            api.get('/admin/my-permissions/')
                .then(r => setPermissions(r.data?.data?.permissions || r.data?.permissions || []))
                .catch(() => setPermissions([]))
        }

        setPendingCounts({ total: 12 }) // student + seller + marketplace
        setPendingCounts({ total: 12 }) // student + seller + marketplace
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated])

    if (!isAuthenticated || (!isAdmin() && !isModerator())) return null

    const totalPending = pendingCounts.total || 0

    const sidebarItems = [
        { label: 'Analytics', href: '/admin', icon: BarChart3, show: isAdmin() },
        { label: 'Pending Approvals', href: '/admin/approvals', icon: RefreshCw, badge: totalPending, show: isAdmin() || isModerator() },
        { label: 'Mall Products', href: '/admin/mall-products', icon: Store, show: isAdmin() },
        { label: 'Marketplace', href: '/admin/marketplace', icon: Grid, show: isAdmin() },
        { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, show: isAdmin() },
        { label: 'User Directory', href: '/admin/users', icon: Users, show: isAdmin() },
        { label: 'Campuses', href: '/admin/campuses', icon: Building2, show: isAdmin() },
        { label: 'Categories', href: '/admin/categories', icon: Tags, show: isAdmin() },
        { label: 'Activity Logs', href: '/admin/activity', icon: CodeSquare, show: isAdmin() },
    ]

    const isActive = (href: string) =>
        pathname === href || (href !== '/admin' && pathname.startsWith(href))

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans">
            {/* Sidebar */}
            <aside className="w-[240px] flex-shrink-0 bg-[#2D1B69] text-white flex flex-col h-full z-20 overflow-y-auto custom-scrollbar">
                {/* Identity block */}
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                            {user?.full_name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                            <p className="font-bold text-base leading-tight">Admin Console</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-0.5">
                                {isAdmin() ? 'Super Admin' : 'Moderator'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nav Sections */}
                <nav className="flex-1 px-3 space-y-2 pb-6 pt-4">
                    {sidebarItems.filter(item => item.show).map((item) => {
                        const active = isActive(item.href)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                                    ${active ? 'bg-white/10 text-white font-bold border-l-4 border-purple-400 -ml-[4px] pl-[15px]' : 'text-white/60 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-purple-300' : 'text-white/40 group-hover:text-white/70'}`} />
                                    {item.label}
                                </div>
                                {item.badge ? (
                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Bar */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-gray-800">Welcome to CampusHat Marketplace</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600 hidden sm:block">
                            Hi, <span className="font-bold text-gray-900">{user?.full_name?.split(' ')[0] || 'Super'}</span>
                        </span>
                        <Link
                            href="/marketplace/post"
                            className="inline-flex items-center gap-1.5 bg-brand-primary text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-brand-dark transition-colors shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" /> Post Ad
                        </Link>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
