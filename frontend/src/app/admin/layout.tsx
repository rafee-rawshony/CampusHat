'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Bell, Search, ChevronDown, ChevronRight, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Map pathname segments to page titles and breadcrumbs
function getBreadcrumbs(pathname: string) {
    const titles: Record<string, string> = {
        '/admin': 'Dashboard',
        '/admin/approvals': 'Review Center',
        '/admin/mall-products': 'Mall Products',
        '/admin/marketplace': 'Marketplace Ads',
        '/admin/orders': 'Order Management',
        '/admin/users': 'User Directory',
        '/admin/campuses': 'Campus Network',
        '/admin/categories': 'Categories',
        '/admin/activity': 'Activity Logs',
        '/admin/sellers': 'Sellers & Stores',
        '/admin/coupons': 'Coupons & Promos',
        '/admin/refunds': 'Refunds',
        '/admin/settings': 'Settings',
    }
    const pageTitle = titles[pathname] || 'Admin'
    return { pageTitle }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, isAdmin, isModerator, logout, _hasHydrated } = useAuthStore()
    const [permissions, setPermissions] = useState<string[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const { pendingCounts, setPendingCounts } = useAdminStore()

    // Auth guard — redirect non-admin/mod users
    useEffect(() => {
        if (!_hasHydrated) return
        if (!isAuthenticated) {
            router.push('/auth/login?redirect=/admin')
            return
        }
        if (!isAdmin() && !isModerator()) {
            router.push('/unauthorized')
            return
        }

        // Moderators: fetch their specific permissions
        if (isModerator() && !isAdmin()) {
            api.get('/admin/my-permissions/')
                .then(r => setPermissions(r.data?.data?.permissions || r.data?.permissions || []))
                .catch(() => setPermissions([]))
        }

        // Fetch pending approval counts for badge display
        const fetchPendingCounts = async () => {
            try {
                const results = await Promise.allSettled([
                    api.get('/admin/verifications/?page_size=1'),
                    api.get('/admin/sellers/pending/?page_size=1'),
                    api.get('/admin/marketplace/pending/?page_size=1'),
                ])
                let total = 0
                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        const count = result.value.data?.data?.pagination?.count
                            ?? result.value.data?.count
                            ?? result.value.data?.data?.length
                            ?? 0
                        total += count
                    }
                })
                setPendingCounts({ total })
            } catch { /* badge just won't show */ }
        }

        fetchPendingCounts()
        const interval = setInterval(fetchPendingCounts, 60_000)
        return () => clearInterval(interval)
    }, [isAuthenticated, isAdmin, isModerator, router, setPendingCounts, _hasHydrated])

    if (!isAuthenticated || (!isAdmin() && !isModerator())) return null

    const totalPending = pendingCounts?.total || 0
    const { pageTitle } = getBreadcrumbs(pathname)

    return (
        <div className="flex min-h-screen bg-[#f5f6fa]">
            {/* Desktop Sidebar — fixed left panel */}
            <aside className="hidden lg:flex w-[260px] fixed inset-y-0 left-0 z-50">
                <div className="w-full h-full">
                    <AdminSidebar
                        permissions={permissions}
                        pendingCount={totalPending}
                    />
                </div>
            </aside>

            {/* Main content area — pushed right by sidebar width */}
            <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen">
                {/* Top header bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger — opens sidebar sheet */}
                        <div className="lg:hidden">
                            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="-ml-1 relative">
                                        <Menu className="w-5 h-5 text-gray-600" />
                                        {totalPending > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                                {totalPending > 9 ? '9+' : totalPending}
                                            </span>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 border-r-0 w-[260px]">
                                    <AdminSidebar
                                        permissions={permissions}
                                        pendingCount={totalPending}
                                        onCloseMobile={() => setSidebarOpen(false)}
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Breadcrumbs + Page title */}
                        <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5 hidden sm:flex">
                                <Link href="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
                                {pathname !== '/admin' && (
                                    <>
                                        <ChevronRight className="w-3 h-3" />
                                        <span className="text-gray-600 font-medium">{pageTitle}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
                                {pageTitle}
                            </h1>
                        </div>
                    </div>

                    {/* Right side — search, notification bell, user avatar */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Inline search toggle */}
                        {searchOpen ? (
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-48 sm:w-64">
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search admin..."
                                    className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400"
                                    onBlur={() => setSearchOpen(false)}
                                    onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                                />
                                <button onClick={() => setSearchOpen(false)}>
                                    <X className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchOpen(true)}
                                className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full"
                            >
                                <Search className="w-[18px] h-[18px]" />
                            </Button>
                        )}

                        {/* Notification bell */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full relative"
                        >
                            <Bell className="w-[18px] h-[18px]" />
                            {totalPending > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                            )}
                        </Button>

                        {/* Separator */}
                        <div className="w-px h-8 bg-gray-100 mx-1 hidden sm:block" />

                        {/* User dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 gap-2 px-2 hover:bg-gray-50 rounded-lg">
                                    <Avatar className="h-7 w-7 rounded-full border border-gray-200">
                                        <AvatarImage src={(user as any)?.profile_picture} />
                                        <AvatarFallback className="bg-[#4C3B8A] text-white text-[11px] font-bold">
                                            {user?.full_name?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-700 hidden sm:inline max-w-[120px] truncate">
                                        {user?.full_name?.split(' ')[0]}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="font-normal">
                                    <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/account" className="cursor-pointer text-sm">
                                        Profile Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/" className="cursor-pointer text-sm">
                                        Back to Store
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => { logout(); router.push('/auth/login') }}
                                    className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer text-sm font-medium"
                                >
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
