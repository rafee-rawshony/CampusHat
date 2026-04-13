'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    BarChart3, ClipboardList, Package, Grid3x3, ShoppingBag,
    Users, Building2, Tag, Activity, LogOut, CheckCircle2
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface AdminSidebarProps {
    permissions: string[]
    pendingCount: number
    onCloseMobile?: () => void
}

export function AdminSidebar({ permissions, pendingCount, onCloseMobile }: AdminSidebarProps) {
    const pathname = usePathname()
    const { user, isAdmin, logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            logout()
            router.push('/auth/login')
        }
    }

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    const navItems = [
        {
            section: 'MAIN',
            items: [
                {
                    label: 'Dashboard / Analytics',
                    href: '/admin',
                    icon: BarChart3,
                    show: isAdmin() || permissions.includes('view_analytics')
                },
                {
                    label: 'Pending Approvals',
                    href: '/admin/approvals',
                    icon: ClipboardList,
                    badge: pendingCount,
                    show: true // all roles see this
                }
            ]
        },
        {
            section: 'COMMERCE',
            items: [
                {
                    label: 'Mall Products',
                    href: '/admin/mall-products',
                    icon: Package,
                    show: isAdmin()
                },
                {
                    label: 'Marketplace Ads',
                    href: '/admin/marketplace',
                    icon: Grid3x3,
                    show: isAdmin() || permissions.includes('approve_marketplace_ads')
                },
                {
                    label: 'Orders',
                    href: '/admin/orders',
                    icon: ShoppingBag,
                    show: isAdmin()
                }
            ]
        },
        {
            section: 'SYSTEM',
            items: [
                {
                    label: 'User Directory',
                    href: '/admin/users',
                    icon: Users,
                    show: isAdmin() || permissions.includes('manage_users')
                },
                {
                    label: 'Campus Network',
                    href: '/admin/campuses',
                    icon: Building2,
                    show: isAdmin() || permissions.includes('manage_universities')
                },
                {
                    label: 'Taxonomy Manager',
                    href: '/admin/categories',
                    icon: Tag,
                    show: isAdmin() || permissions.includes('manage_categories')
                },
                {
                    label: 'Activity Logs',
                    href: '/admin/activity',
                    icon: Activity,
                    show: isAdmin()
                }
            ]
        }
    ]

    return (
        <div className="flex flex-col h-full bg-[#2D1B69]">
            {/* SIDEBAR HEADER */}
            <div className="p-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">Admin Console</p>
                        <p className="text-[10px] uppercase tracking-wider text-white/50">
                            {isAdmin() ? 'SUPER ADMIN' : 'MODERATOR'}
                        </p>
                    </div>
                </div>
            </div>

            {/* SIDEBAR NAVIGATION */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
                {navItems.map((group, gIdx) => {
                    const visibleItems = group.items.filter(item => item.show)
                    if (visibleItems.length === 0) return null

                    return (
                        <div key={gIdx} className="mb-4">
                            <h3 className="text-[10px] text-white/30 uppercase tracking-wider px-3 mb-2 mt-2 font-semibold">
                                {group.section}
                            </h3>
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const active = isActive(item.href)
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onCloseMobile}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 relative group
                                                ${active 
                                                    ? 'bg-white/15 text-white font-semibold' 
                                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r content-['']" />
                                            )}
                                            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge && item.badge > 0 ? (
                                                <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">
                                                    {item.badge > 99 ? '99+' : item.badge}
                                                </span>
                                            ) : null}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* SIDEBAR FOOTER */}
            <div className="p-4 border-t border-white/10 shrink-0 flex items-center gap-3">
                <Avatar className="w-8 h-8 rounded-full border border-white/20 relative">
                    <AvatarImage src={(user as any)?.profile_picture} />
                    <AvatarFallback className="bg-white/10 text-white text-xs">{getInitials(user?.full_name || '')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
                    <p className="text-white/40 text-[10px] uppercase truncate">{user?.role?.replace(/_/g, ' ')}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                    title="Log Out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
