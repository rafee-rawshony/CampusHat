'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    BarChart3, ClipboardList, Package, Grid3x3, ShoppingBag,
    Users, Building2, Tag, Activity, LogOut, Shield, Store,
    Ticket, RotateCcw, Settings, ChevronDown, Wallet, Bell
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AdminSidebarProps {
    permissions: string[]
    pendingCount: number
    onCloseMobile?: () => void
}

// Collapsible section for sidebar navigation groups
function SidebarSection({ label, children, defaultOpen = true }: {
    label: string; children: React.ReactNode; defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div className="mb-2">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-1.5 group"
            >
                <h3 className="text-[10px] text-white/25 font-semibold uppercase tracking-[0.15em]">
                    {label}
                </h3>
                <ChevronDown className={`w-3 h-3 text-white/20 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
            </button>
            {open && <div className="space-y-0.5 mt-0.5">{children}</div>}
        </div>
    )
}

export function AdminSidebar({ permissions, pendingCount, onCloseMobile }: AdminSidebarProps) {
    const pathname = usePathname()
    const { user, isAdmin, logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push('/auth/login')
    }

    // Check if a nav item is currently active
    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    // Navigation item renderer
    const NavItem = ({ href, icon: Icon, label, badge, show = true }: {
        href: string; icon: any; label: string; badge?: number; show?: boolean
    }) => {
        if (!show) return null
        const active = isActive(href)
        return (
            <Link
                href={href}
                onClick={onCloseMobile}
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 relative group
                    ${active
                        ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    }
                `}
            >
                {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-400 rounded-r-full" />
                )}
                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-orange-300' : ''}`} />
                <span className="flex-1 truncate">{label}</span>
                {badge && badge > 0 ? (
                    <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shrink-0 shadow-sm">
                        {badge > 99 ? '99+' : badge}
                    </span>
                ) : null}
            </Link>
        )
    }

    const admin = isAdmin()

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#1e1548] to-[#130d30]">
            {/* Header — brand identity */}
            <div className="px-5 pt-6 pb-5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm tracking-tight">CampusHat</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                            {admin ? 'Admin Panel' : 'Moderator'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
                {/* OVERVIEW */}
                <SidebarSection label="Overview">
                    <NavItem href="/admin" icon={BarChart3} label="Dashboard" show={admin || permissions.includes('view_analytics')} />
                    <NavItem href="/admin/approvals" icon={ClipboardList} label="Review Center" badge={pendingCount} />
                </SidebarSection>

                {/* COMMERCE */}
                <SidebarSection label="Commerce">
                    <NavItem href="/admin/orders" icon={ShoppingBag} label="Orders" show={admin} />
                    <NavItem href="/admin/mall-products" icon={Package} label="Mall Products" show={admin} />
                    <NavItem
                        href="/admin/marketplace"
                        icon={Grid3x3}
                        label="Marketplace Ads"
                        show={admin || permissions.includes('approve_marketplace_ads')}
                    />
                    <NavItem href="/admin/sellers" icon={Store} label="Sellers & Stores" show={admin} />
                    <NavItem href="/admin/coupons" icon={Ticket} label="Coupons & Promos" show={admin} />
                    <NavItem href="/admin/refunds" icon={RotateCcw} label="Refunds" show={admin} />
                </SidebarSection>

                {/* PEOPLE & CAMPUS */}
                <SidebarSection label="People & Campus">
                    <NavItem
                        href="/admin/users"
                        icon={Users}
                        label="User Directory"
                        show={admin || permissions.includes('manage_users')}
                    />
                    <NavItem
                        href="/admin/campuses"
                        icon={Building2}
                        label="Campus Network"
                        show={admin || permissions.includes('manage_universities')}
                    />
                </SidebarSection>

                {/* SYSTEM */}
                <SidebarSection label="System">
                    <NavItem
                        href="/admin/categories"
                        icon={Tag}
                        label="Categories"
                        show={admin || permissions.includes('manage_categories')}
                    />
                    <NavItem href="/admin/activity" icon={Activity} label="Activity Logs" show={admin} />
                    <NavItem href="/admin/settings" icon={Settings} label="Settings" show={admin} />
                </SidebarSection>
            </nav>

            {/* Footer — user profile + logout */}
            <div className="p-4 border-t border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 rounded-full border-2 border-white/10">
                        <AvatarImage src={(user as any)?.profile_picture} />
                        <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">
                            {user?.full_name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-[13px] font-medium truncate">{user?.full_name}</p>
                        <p className="text-white/30 text-[10px] uppercase tracking-wide truncate">
                            {user?.role?.replace(/_/g, ' ')}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Log Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
