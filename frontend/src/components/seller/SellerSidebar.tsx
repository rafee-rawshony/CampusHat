'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Wallet,
    MessageCircle,
    Settings,
    LogOut,
    ExternalLink,
    Boxes,
    Star,
    RotateCcw,
    BarChart3,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function SellerSidebarContent() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useAuthStore()

    // We can fetch basic store info / stats to show badge
    const { data: statsData } = useQuery({
        queryKey: ['seller-stats'],
        queryFn: () => api.get('/sellers/my-dashboard/').then(r => r.data?.data || r.data),
        staleTime: 30_000,
        // Don't refetch too aggressively here, the main dashboard will handle the heavy lifting
    })

    // Daraz-style menu — grouped by function. Badge counts come from
    // the dashboard endpoint so the user sees what needs attention.
    const NAV_ITEMS = [
        { label: 'Overview',   href: '/seller',             icon: LayoutDashboard, exact: true },
        { label: 'Products',   href: '/seller/products',    icon: Package,
            badge: statsData?.out_of_stock_products > 0 ? statsData.out_of_stock_products : null },
        { label: 'Inventory',  href: '/seller/inventory',   icon: Boxes,
            badge: statsData?.low_stock_products > 0 ? statsData.low_stock_products : null },
        { label: 'Orders',     href: '/seller/orders',      icon: ShoppingBag,
            badge: statsData?.pending_orders > 0 ? statsData.pending_orders : null },
        { label: 'Returns',    href: '/seller/returns',     icon: RotateCcw },
        { label: 'Reviews',    href: '/seller/reviews',     icon: Star },
        { label: 'Performance', href: '/seller/performance', icon: BarChart3 },
        { label: 'Wallet',     href: '/seller/wallet',      icon: Wallet },
        { label: 'Messages',   href: '/seller/messages',    icon: MessageCircle },
        { label: 'Settings',   href: '/seller/settings',    icon: Settings },
    ]

    const handleLogout = async () => {
        await logout()
        router.push('/auth/login')
    }

    // Attempt to parse out store info if api provided it inside user, else fallback
    // Fetch the seller's own store from GET /stores/my-store/ (authenticated)
    const { data: storeData } = useQuery({
        queryKey: ['my-store'],
        queryFn: () => api.get('/stores/my-store/').then(r => r.data).catch(() => null),
        staleTime: 300_000
    })

    return (
        <>
            {/* SIDEBAR HEADER */}
            <div className="p-4 border-b border-gray-100 flex flex-col items-center justify-center shrink-0">
                <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-2 shadow-sm border border-gray-200 object-cover"
                    style={{ 
                        backgroundColor: storeData?.banner_color || '#4C3B8A',
                        backgroundImage: storeData?.logo ? `url(${storeData.logo})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {!storeData?.logo && (storeData?.name?.charAt(0) || 'S')}
                </div>
                <h2 className="font-bold text-sm text-gray-900 line-clamp-1 text-center w-full">
                    {storeData?.name || 'My Store'}
                </h2>
                <p className="text-xs text-gray-400 line-clamp-1 w-full text-center">
                    {storeData?.contact_email || 'Seller Account'}
                </p>
            </div>

            {/* SIDEBAR NAVIGATION */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                {NAV_ITEMS.map(item => {
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                    const Icon = item.icon
                    
                    return (
                        <Link 
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors group",
                                isActive 
                                    ? "bg-[#4C3B8A] text-white" 
                                    : "text-gray-600 hover:bg-gray-100 font-medium"
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                            
                            {item.badge && (
                                <span className={cn(
                                    "min-w-[20px] h-5 text-[10px] font-bold rounded-full ml-auto flex items-center justify-center px-1.5 transition-colors",
                                    isActive ? "bg-white text-[#4C3B8A]" : "bg-red-500 text-white"
                                )}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* SIDEBAR FOOTER */}
            <div className="p-3 border-t border-gray-100 space-y-1 shrink-0">
                {storeData?.slug && (
                    <Link 
                        href={`/sellers/${storeData.slug}`} 
                        target="_blank"
                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#4C3B8A] transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Visit Store
                    </Link>
                )}
                
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-3 h-3" />
                    Logout
                </button>
            </div>
        </>
    )
}

export function SellerSidebar() {
    return (
        <aside className="hidden md:flex flex-col w-[200px] shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0 left-0">
            <SellerSidebarContent />
        </aside>
    )
}
