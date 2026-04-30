'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Search, ShoppingBasket, Key, Bell, UtensilsCrossed, Grid3X3, Store, Users, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

const mallLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Categories', href: '/categories', icon: Grid3X3 },
    { label: 'Shop', href: '/shop', icon: Store },
    { label: 'Sellers', href: '/sellers', icon: Users },
]

const marketplaceLinks = [
    { label: 'Home', href: '/marketplace', icon: Home },
    { label: 'Explorer', href: '/marketplace/explorer', icon: Search },
    { label: 'Buy', href: '/marketplace/buy', icon: ShoppingBasket },
    { label: 'Rental', href: '/marketplace/rental', icon: Key },
    { label: 'Services', href: '/marketplace/services', icon: Bell },
    { label: 'Food', href: '/marketplace/food', icon: UtensilsCrossed },
]

export function SecondaryNav() {
    const pathname = usePathname()
    const { isAuthenticated, isSeller } = useAuthStore()
    const isMarketplace = pathname?.startsWith('/marketplace')
    const links = isMarketplace ? marketplaceLinks : mallLinks

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-6 md:space-x-8 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
                        {links.map((link) => {
                            const isActive = pathname === link.href
                            const Icon = link.icon
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'flex items-center py-3 text-sm font-semibold transition-colors',
                                        isActive
                                            ? 'text-[#4C3B8A]'
                                            : 'text-gray-700 hover:text-[#4C3B8A]'
                                    )}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {link.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Become a Seller / Seller Dashboard — Mall only, desktop only */}
                    {!isMarketplace && isAuthenticated && (
                        <div className="hidden sm:flex items-center ml-4 shrink-0">
                            {isSeller() ? (
                                <Link
                                    href="/seller"
                                    className="flex items-center gap-1.5 bg-[#4C3B8A] text-white font-bold py-1.5 px-4 rounded-md hover:bg-[#2D1B69] transition-colors text-xs whitespace-nowrap"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Seller Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/seller/apply"
                                    className="flex items-center gap-1.5 bg-[#4C3B8A] text-white font-bold py-1.5 px-4 rounded-md hover:bg-[#2D1B69] transition-colors text-xs whitespace-nowrap"
                                >
                                    <Store className="w-3.5 h-3.5" />
                                    Become a Seller
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
