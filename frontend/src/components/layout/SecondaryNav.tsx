'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const mallLinks = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Shop', href: '/shop' },
    { label: 'Sellers', href: '/sellers' },
]

const marketplaceLinks = [
    { label: 'Home', href: '/marketplace' },
    { label: 'Explorer', href: '/marketplace/explorer' },
    { label: 'Buy', href: '/marketplace/buy' },
    { label: 'Rental', href: '/marketplace/rental' },
    { label: 'Services', href: '/marketplace/services' },
    { label: 'Food', href: '/marketplace/food' },
]

export function SecondaryNav() {
    const pathname = usePathname()
    const isMarketplace = pathname?.startsWith('/marketplace')
    const links = isMarketplace ? marketplaceLinks : mallLinks

    return (
        <div className="bg-white border-b border-surface-border">
            <div className="container mx-auto px-4">
                <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium whitespace-nowrap rounded-btn transition-colors',
                                    isActive
                                        ? 'text-brand-primary bg-brand-light'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                                )}
                            >
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
