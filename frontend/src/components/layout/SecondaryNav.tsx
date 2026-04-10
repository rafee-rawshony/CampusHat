'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Search, ShoppingBasket, Key, Bell, UtensilsCrossed, Grid3X3, Store, Users } from 'lucide-react'

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
    const isMarketplace = pathname?.startsWith('/marketplace')
    const links = isMarketplace ? marketplaceLinks : mallLinks

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-start items-center space-x-6 md:space-x-8 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
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
                                        ? 'text-[#634C9F]'
                                        : 'text-gray-700 hover:text-[#634C9F]'
                                )}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {link.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
