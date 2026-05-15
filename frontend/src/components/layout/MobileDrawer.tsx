'use client'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
    Menu, Store, LayoutDashboard, X, Home, Grid, ShoppingBag, Users,
    MessageSquare, Package, List, ShieldCheck, ChevronRight, LogOut,
    ShoppingCart, KeyRound, Utensils, Briefcase, User as UserIcon,
    MapPin, CreditCard, Ticket, Star, Heart, RotateCcw, Wallet,
    Bell,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { absoluteMediaUrl } from '@/services/upload.service'

type NavLink = { href: string; label: string; icon: React.ElementType }

const MALL_LINKS: NavLink[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/categories', label: 'Categories', icon: Grid },
    { href: '/shop', label: 'Shop', icon: ShoppingBag },
    { href: '/sellers', label: 'Top Sellers', icon: Users },
]

const MARKETPLACE_LINKS: NavLink[] = [
    { href: '/marketplace', label: 'Home', icon: Home },
    { href: '/marketplace?type=buy', label: 'Buy & Sell', icon: ShoppingCart },
    { href: '/marketplace?type=rental', label: 'Rentals', icon: KeyRound },
    { href: '/marketplace?type=service', label: 'Services', icon: Briefcase },
    { href: '/marketplace?type=food', label: 'Food', icon: Utensils },
]

const ACCOUNT_LINKS: NavLink[] = [
    { href: '/account', label: 'My Profile', icon: UserIcon },
    { href: '/marketplace/chat', label: 'Messages', icon: MessageSquare },
    { href: '/account/orders', label: 'My Orders', icon: Package },
    { href: '/account/listings', label: 'My Listings', icon: List },
    { href: '/account/addresses', label: 'Address Book', icon: MapPin },
    { href: '/account/payments', label: 'Payment Options', icon: CreditCard },
    { href: '/account/vouchers', label: 'My Vouchers', icon: Ticket },
    { href: '/account/reviews', label: 'My Reviews', icon: Star },
    { href: '/wishlist', label: 'My Wishlist', icon: Heart },
    { href: '/account/followed-stores', label: 'Followed Stores', icon: Store },
    { href: '/account/returns', label: 'My Returns', icon: RotateCcw },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/account/notifications', label: 'Notifications', icon: Bell },
]

export function MobileDrawer() {
    const { user, isAuthenticated, _hasHydrated, logout, isSeller } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname() || ''

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    const isActive = (href: string) => {
        const path = href.split('?')[0]
        if (path === '/') return pathname === '/'
        if (path === '/marketplace') return pathname === '/marketplace'
        return pathname === path || pathname.startsWith(path + '/')
    }

    const renderLink = (link: NavLink) => {
        const Icon = link.icon
        const active = isActive(link.href)
        return (
            <DialogPrimitive.Close asChild key={link.href + link.label}>
                <Link
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] ${
                        active
                            ? 'bg-brand-primary/10 text-brand-primary font-bold'
                            : 'text-gray-700 hover:bg-gray-50 font-semibold'
                    }`}
                >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-brand-primary' : 'text-gray-400'}`} />
                    <span className="flex-1">{link.label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-brand-primary" />}
                </Link>
            </DialogPrimitive.Close>
        )
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    className="sm:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[300px] sm:w-[320px] p-0 flex flex-col border-r-0 bg-white"
            >
                <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>

                {/* USER HEADER */}
                <div className="relative bg-gradient-to-br from-[#4C3B8A] via-[#5d4ba1] to-[#2D1B69] px-5 pt-6 pb-6 overflow-hidden">
                    {/* Decorative orbs */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" aria-hidden />
                    <div className="absolute -bottom-12 -left-6 w-24 h-24 bg-white/5 rounded-full blur-xl" aria-hidden />

                    {/* Close button */}
                    <DialogPrimitive.Close asChild>
                        <button
                            aria-label="Close menu"
                            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </DialogPrimitive.Close>

                    <div className="relative z-10">
                        {!_hasHydrated ? (
                            <div className="space-y-2">
                                <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse" />
                                <div className="h-4 w-32 bg-white/20 rounded animate-pulse mt-3" />
                            </div>
                        ) : isAuthenticated && user ? (
                            <div className="text-white">
                                <div className="w-16 h-16 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center font-black text-2xl mb-3 shadow-lg overflow-hidden">
                                    {user.profile_picture ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={absoluteMediaUrl(user.profile_picture)}
                                            alt={user.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user.full_name?.[0]?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <p className="font-black text-lg tracking-tight leading-tight truncate">
                                    {user.full_name}
                                </p>
                                <p className="text-xs opacity-80 font-medium mt-0.5 truncate">
                                    {user.university_name || 'University Member'}
                                </p>
                            </div>
                        ) : (
                            <div className="py-1">
                                <p className="text-white font-black text-2xl mb-1 tracking-tight">Welcome!</p>
                                <p className="text-white/80 text-xs mb-4">Sign in to manage your account</p>
                                <DialogPrimitive.Close asChild>
                                    <Link
                                        href="/auth/login"
                                        className="bg-white text-brand-primary text-sm font-black px-4 py-3 rounded-xl block text-center shadow-lg w-full active:scale-[0.98] transition-transform"
                                    >
                                        Sign In / Register
                                    </Link>
                                </DialogPrimitive.Close>
                            </div>
                        )}
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 overflow-y-auto no-scrollbar p-3 pb-6 space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 mb-1.5 mt-1">
                        Mall
                    </p>
                    <div className="space-y-0.5">{MALL_LINKS.map((l) => renderLink(l))}</div>

                    {isAuthenticated && (
                        <div className="pt-2 pb-1">
                            <DialogPrimitive.Close asChild>
                                {isSeller() ? (
                                    <Link
                                        href="/dashboard/seller"
                                        className="flex items-center gap-2 px-3 py-3 rounded-xl font-bold bg-gradient-to-r from-[#4C3B8A] to-[#5d4ba1] text-white text-sm transition-all shadow-md shadow-brand-primary/20 active:scale-[0.98]"
                                    >
                                        <LayoutDashboard className="w-4 h-4" /> Seller Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href="/seller/register"
                                        className="flex items-center gap-2 px-3 py-3 rounded-xl font-bold bg-gradient-to-r from-[#4C3B8A] to-[#5d4ba1] text-white text-sm transition-all shadow-md shadow-brand-primary/20 active:scale-[0.98]"
                                    >
                                        <Store className="w-4 h-4" /> Become a Seller
                                    </Link>
                                )}
                            </DialogPrimitive.Close>
                        </div>
                    )}

                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 mt-5 mb-1.5">
                        Marketplace
                    </p>
                    <div className="space-y-0.5">{MARKETPLACE_LINKS.map((l) => renderLink(l))}</div>

                    {isAuthenticated && (
                        <>
                            <div className="my-4 border-t border-gray-100" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 mb-1.5">
                                Account
                            </p>
                            <div className="space-y-0.5">{ACCOUNT_LINKS.map((l) => renderLink(l))}</div>
                            {user?.role === 'normal_user' && (
                                <DialogPrimitive.Close asChild>
                                    <Link
                                        href="/account/verify"
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-amber-700 hover:bg-amber-50 font-semibold mt-1"
                                    >
                                        <ShieldCheck className="w-[18px] h-[18px] shrink-0 text-amber-500" />
                                        <span className="flex-1">Verify Student ID</span>
                                    </Link>
                                </DialogPrimitive.Close>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 font-bold transition-all hover:bg-red-50 active:bg-red-100 rounded-xl mt-3 text-sm"
                            >
                                <LogOut className="w-[18px] h-[18px] shrink-0" />
                                Log Out
                            </button>
                        </>
                    )}
                </nav>

                {/* FOOTER */}
                <div className="px-5 py-3 border-t border-gray-100 text-[10px] font-bold text-gray-400 bg-gray-50/60 flex items-center justify-between">
                    <span>0 800 300-HAT</span>
                    <span>support@campushat.com</span>
                </div>
            </SheetContent>
        </Sheet>
    )
}
