'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Home, Package, ShoppingBag, MessageSquare, Settings,
    Bell, LogOut, Search, Plus, X, AlertTriangle, CheckCircle, Star, Menu
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isSeller, isAuthenticated, logout, _hasHydrated } = useAuthStore()
    const [isAlertsOpen, setIsAlertsOpen] = useState(true)

    useEffect(() => {
        if (!_hasHydrated) return

        if (!isAuthenticated) {
            router.push('/auth/login')
        } else if (!isSeller() && user?.seller_application_status !== 'pending' && pathname !== '/seller/apply') {
            router.push('/seller/apply')
        }
    }, [isAuthenticated, isSeller, pathname, router, user?.seller_application_status])

    if (!_hasHydrated || !isAuthenticated) return null

    // Don't show layout for apply page, it has its own standalone UI
    if (pathname === '/seller/apply') {
        return <>{children}</>
    }

    if (!isSeller() && user?.seller_application_status === 'pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Application Under Review</h2>
                    <p className="text-gray-500 mb-8">
                        Your application to become a seller is currently being reviewed by our moderation team. You will receive an email once it is approved.
                    </p>
                    <Link href="/">
                        <Button className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl h-12 shadow-md">
                            Return to Homepage
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    if (!isSeller()) return null

    const storeSlug = (user as any)?.store_slug || 'my-store'
    const storeName = (user as any)?.store_name || user?.full_name || 'My Store'

    const sidebarLinks = [
        { name: 'Overview', href: '/seller', icon: Home, exact: true },
        { name: 'Products', href: '/seller/products', icon: Package },
        { name: 'Orders', href: '/seller/orders', icon: ShoppingBag },
        { name: 'Messages', href: '/seller/messages', icon: MessageSquare },
        { name: 'Settings', href: '/seller/settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
            {/* === Top Bar (CampusHat Navbar Replica) === */}
            <nav className="bg-white shadow-nav sticky top-0 z-40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4 h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center shrink-0 mr-4">
                            <span className="text-2xl md:text-3xl font-bold text-gray-800">Campus</span>
                            <span className="text-2xl md:text-3xl font-bold text-brand-primary">Hat</span>
                        </Link>

                        {/* Search */}
                        <div className="flex-1 max-w-xl hidden md:block">
                            <div className="relative border rounded-lg bg-gray-50 flex items-center px-3 py-2">
                                <Search className="h-4 w-4 text-gray-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search products, orders..."
                                    className="bg-transparent border-none focus:outline-none text-sm w-full outline-none"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4 ml-auto">
                            <Button
                                variant="default"
                                size="sm"
                                className="hidden md:flex gap-2 bg-brand-primary hover:bg-brand-dark"
                                onClick={() => router.push('/marketplace/post')}
                            >
                                <Plus className="h-4 w-4" /> Post Ad
                            </Button>

                            <div className="hidden md:flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getInitials(storeName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-700">Hi, {storeName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Desktop Header */}
            <div className="hidden sm:flex bg-white border-b border-gray-200 shadow-sm z-30 relative">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <div>
                        <h1 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-2">
                            Seller Control Center
                            <span className="text-xs font-normal text-gray-500 hidden sm:inline">| Manage your {storeName} business at CampusHat</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-brand-primary rounded-full hover:bg-gray-100">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => logout()} className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs gap-1.5 rounded-full">
                            <LogOut className="w-3.5 h-3.5" /> Log Out
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Header (replaces standard header on small screens) */}
            <div className='sm:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50'>
                <h1 className='font-bold text-lg text-gray-900'>Seller Center</h1>
                <Sheet>
                    <SheetTrigger asChild>
                        <button className='p-2 -mr-2 text-gray-500 hover:bg-gray-50 rounded-lg'>
                            <Menu className='w-6 h-6' />
                        </button>
                    </SheetTrigger>
                    <SheetContent side='bottom' className='h-auto rounded-t-3xl'>
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <div className="py-2">
                            <h2 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menu</h2>
                            {sidebarLinks.map(item => {
                                const Icon = item.icon
                                return (
                                    <Link key={item.href} href={item.href}
                                        className='flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors'>
                                        <Icon className='w-5 h-5 text-brand-primary' />
                                        <span className='font-bold text-gray-700'>{item.name}</span>
                                    </Link>
                                )
                            })}
                            <div className="border-t border-gray-100 my-2"></div>
                            <button onClick={logout} className='w-full flex items-center gap-3 p-4 hover:bg-red-50 text-red-500 rounded-xl transition-colors'>
                                <LogOut className='w-5 h-5' />
                                <span className='font-bold'>Log Out</span>
                            </button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* === 3-Column Layout Wrapper === */}
            <div className="flex-1 container mx-auto px-0 sm:px-4 py-0 sm:py-6 relative">
                <div className="flex items-start gap-4 sm:gap-6 relative">

                    {/* COLUMN 1: Seller Sidebar (200px) */}
                    <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-4">
                        {/* Store Info Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md border-4 border-white mb-3">
                                {getInitials(storeName)}
                            </div>
                            <h2 className="font-extrabold text-gray-900 text-sm leading-tight">{storeName}</h2>
                            <p className="text-[10px] text-gray-400 mt-1 truncate w-full">{user?.email}</p>
                        </div>

                        {/* Navigation Menu Card */}
                        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200">
                            <nav className="space-y-1">
                                {sidebarLinks.map((link) => {
                                    const isActive = link.href === '/seller'
                                        ? pathname === '/seller' || pathname === '/seller/dashboard'
                                        : pathname.startsWith(link.href)

                                    const Icon = link.icon
                                    return (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            className={`
                                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all
                                                ${isActive
                                                    ? 'bg-brand-primary text-white shadow-md'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                            {link.name}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* COLUMN 2: Main Content (flex-1) */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>

                    {/* COLUMN 3: Alerts & Activity (240px) */}
                    {isAlertsOpen && (
                        <div className="hidden xl:flex flex-col w-[240px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-32 max-h-[calc(100vh-8rem)]">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-extrabold text-gray-900 text-sm">Alerts & Activity</h3>
                                <button onClick={() => setIsAlertsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Feed List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                                {/* Item 1: New Order */}
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-blue-100 p-1.5 rounded-full shrink-0">
                                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-800 font-medium leading-tight">Order <span className="font-bold text-gray-900">#ORD-082736</span> just came in from Hall 4.</p>
                                        <span className="text-[10px] text-gray-400 font-medium mt-1 block">2 mins ago</span>
                                    </div>
                                </div>

                                {/* Item 2: Review */}
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-yellow-100 p-1.5 rounded-full shrink-0">
                                        <Star className="w-3.5 h-3.5 text-yellow-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-800 font-medium leading-tight">A student left a 5-star review on Dell XPS 13</p>
                                        <span className="text-[10px] text-gray-400 font-medium mt-1 block">1 hour ago</span>
                                    </div>
                                </div>

                                {/* Item 3: Payout */}
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-green-100 p-1.5 rounded-full shrink-0">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-800 font-medium leading-tight"><span className="font-bold text-gray-900">৳2,500</span> has been transferred to your account.</p>
                                        <span className="text-[10px] text-gray-400 font-medium mt-1 block">3 hours ago</span>
                                    </div>
                                </div>

                                {/* Item 4: Warning */}
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-orange-100 p-1.5 rounded-full shrink-0">
                                        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-800 font-medium leading-tight">HP Wireless Keyboard is down to 2 units.</p>
                                        <span className="text-[10px] text-gray-400 font-medium mt-1 block">Yesterday</span>
                                    </div>
                                </div>

                            </div>

                            {/* Pro Tip Card */}
                            <div className="p-4 bg-gradient-to-br from-brand-primary to-purple-800 text-white m-3 rounded-xl shadow-inner relative overflow-hidden group border border-white/10">
                                <div className="absolute -right-4 -bottom-4 bg-white/10 w-16 h-16 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#d8cff8] mb-1">Campus Pro Tip</p>
                                    <p className="text-xs font-medium leading-relaxed">Deliveries to the Student Union between 12-2PM receive 40% higher ratings.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
