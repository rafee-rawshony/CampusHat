'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Menu, Bell } from 'lucide-react'
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, isAdmin, isModerator, logout, _hasHydrated } = useAuthStore()
    const [permissions, setPermissions] = useState<string[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { pendingCounts, setPendingCounts } = useAdminStore()

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

        if (isModerator() && !isAdmin()) {
            api.get('/admin/my-permissions/')
                .then(r => setPermissions(r.data?.data?.permissions || r.data?.permissions || []))
                .catch(() => setPermissions([]))
        }

        // Initialize pending counts block if needed
        api.get('/admin/approvals/counts/')
            .then(r => setPendingCounts({ total: r.data?.data?.total || r.data?.total || 0}))
            .catch(()=> {/* silent ignore */})

    }, [isAuthenticated, isAdmin, isModerator, router, setPendingCounts])

    if (!isAuthenticated || (!isAdmin() && !isModerator())) return null

    const totalPending = pendingCounts?.total || 0

    return (
        <div className="flex min-h-screen bg-[#F5F5F5] font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-[240px] fixed inset-y-0 left-0 z-50">
                <div className="w-full h-full shadow-xl">
                    <AdminSidebar 
                        permissions={permissions} 
                        pendingCount={totalPending} 
                    />
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:ml-[240px] min-h-screen">
                {/* Top Bar */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        {/* Mobile Hamburger Drawer */}
                        <div className="md:hidden">
                            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="-ml-2">
                                        <Menu className="w-6 h-6 text-gray-700" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 border-r-0 w-[240px]">
                                    <AdminSidebar 
                                        permissions={permissions} 
                                        pendingCount={totalPending}
                                        onCloseMobile={() => setSidebarOpen(false)}
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Page Title */}
                        <span className="font-semibold text-gray-900 text-lg hidden sm:block">
                            {pathname === '/admin' ? 'Dashboard' : 
                             pathname.includes('/approvals') ? 'Review Center' : 
                             'Admin Console'}
                        </span>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                            <Bell className="w-5 h-5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8 rounded-full border border-gray-200">
                                        <AvatarImage src={(user as any)?.profile_picture} />
                                        <AvatarFallback className="bg-brand-primary text-white text-xs">{user?.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/account" className="w-full cursor-pointer">Profile Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { logout(); router.push('/auth/login') }} className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer text-sm font-medium mt-1">
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page View */}
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
