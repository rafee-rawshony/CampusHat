'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard, Users, ShieldCheck, Store,
    ShoppingBag, CreditCard, BarChart3,
    Settings, LogOut, ArrowLeft, Bell
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, isAdmin, isModerator, logout } = useAuthStore()
    const { permissions, setPermissions, setPendingCounts, hasPermission } = useAdminStore()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }
        if (!isAdmin() && !isModerator()) {
            router.push('/unauthorized')
            return
        }

        // Fetch permissions from API: GET /api/v1/admin/my-permissions/
        // Mock: admin gets all permissions, moderators get role-specific ones
        const mockPerms = isAdmin()
            ? ['admin']
            : isModerator()
                ? ['seller_moderator'] // or 'marketplace_moderator'
                : []
        setPermissions(mockPerms)

        // Fetch pending counts: GET /api/v1/admin/pending-counts/
        setPendingCounts({
            sellers: 4,
            marketplace: 7,
            verifications: 12,
            refunds: 2,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated])

    if (!isAuthenticated || (!isAdmin() && !isModerator())) return null

    const navItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, perm: null },
        { label: 'Users', href: '/admin/users', icon: Users, perm: 'admin' },
        { label: 'Verifications', href: '/admin/verifications', icon: ShieldCheck, perm: 'admin' },
        { label: 'Seller Approvals', href: '/admin/sellers', icon: Store, perm: 'seller_moderator' },
        { label: 'Marketplace', href: '/admin/marketplace', icon: ShoppingBag, perm: 'marketplace_moderator' },
        { label: 'Refunds', href: '/admin/refunds', icon: CreditCard, perm: 'finance_moderator' },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, perm: 'admin' },
        { label: 'Settings', href: '/admin/settings', icon: Settings, perm: 'admin' },
    ]

    const visibleItems = navItems.filter(item => {
        if (!item.perm) return true // always shown (Dashboard)
        return hasPermission(item.perm)
    })

    const isActive = (href: string) =>
        pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))

    return (
        <div className="flex h-screen overflow-hidden bg-[#F5F5F5] font-sans">

            {/* Sidebar */}
            <aside className="w-[240px] flex-shrink-0 bg-[#2D1B69] text-white flex flex-col h-full shadow-2xl z-20">

                {/* Identity block */}
                <div className="p-5 border-b border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                        {user?.full_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight truncate max-w-[140px]">{user?.full_name || 'Admin'}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-0.5">
                            {isAdmin() ? 'Super Admin' : 'Moderator'}
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-3 px-3">Navigation</p>
                    {visibleItems.map((item) => {
                        const active = isActive(item.href)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
                                    ${active ? 'bg-white/15 text-white font-bold' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}
                            >
                                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-300 rounded-r-full" />}
                                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-purple-300' : 'text-white/40'}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-white/10 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/8 hover:text-white transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 text-white/40" />
                        Back to Site
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Top Bar */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider">CampusHat</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm font-bold text-gray-800">Admin Console</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center">
                                {user?.full_name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <span className="text-sm font-bold text-gray-700 hidden sm:block">{user?.full_name || 'Admin'}</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
